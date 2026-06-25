const db = require('../config/db');

const getFormAssignments = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query = '';
        let params = [userId];

        if (role === 'teacher') {
            query = `
                SELECT f.*, c.class_name, c.subject_code 
                FROM FormAssignments f
                JOIN Classes c ON f.class_id = c.id
                WHERE c.teacher_id = ?
                ORDER BY f.created_at DESC
            `;
        } else {
            query = `
                SELECT f.id, f.class_id, f.title, f.description, f.header_image, f.due_date, f.is_active, f.created_at,
                       c.class_name, c.subject_code,
                       s.score_percentage as marks_awarded
                FROM FormAssignments f
                JOIN Classes c ON f.class_id = c.id
                JOIN Class_Students cs ON c.id = cs.class_id
                LEFT JOIN FormSubmissions s ON f.id = s.form_id AND s.student_id = ?
                WHERE cs.student_id = ? AND f.is_active = TRUE
                ORDER BY f.created_at DESC
            `;
            params = [userId, userId];
        }

        const [forms] = await db.query(query, params);
        res.json(forms);
    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ message: 'Server error fetching forms' });
    }
};

const getFormAssignmentById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [forms] = await db.query('SELECT * FROM FormAssignments WHERE id = ?', [id]);
        if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
        
        const form = forms[0];
        
        // If student, remove correct_answer from fields so they can't cheat!
        if (req.user.role === 'student') {
            let fields = form.fields;
            if (typeof fields === 'string') fields = JSON.parse(fields);
            
            const sanitizedFields = fields.map(f => {
                const { correct_answer, ...safeField } = f;
                return safeField;
            });
            form.fields = sanitizedFields;
        } else {
            if (typeof form.fields === 'string') form.fields = JSON.parse(form.fields);
        }

        res.json(form);
    } catch (error) {
        console.error('Error fetching form details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createFormAssignment = async (req, res) => {
    const { class_id, title, description, header_image, fields, due_date } = req.body;
    const teacherId = req.user.id;

    try {
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [class_id, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        const [insertRes] = await db.query(
            'INSERT INTO FormAssignments (class_id, title, description, header_image, fields, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [class_id, title, description, header_image, JSON.stringify(fields), due_date]
        );

        // Notify students
        const notificationService = require('../services/notificationService');
        const [students] = await db.query('SELECT student_id FROM Class_Students WHERE class_id = ?', [class_id]);
        for (const student of students) {
            await notificationService.createNotification(
                student.student_id,
                'New Dynamic Form Assigned',
                `A new form "${title}" has been assigned for ${classes[0].class_name}.`,
                'form',
                insertRes.insertId
            );
        }

        res.json({ message: 'Form Assignment created successfully' });
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const submitFormAssignment = async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;
    const studentId = req.user.id;

    try {
        // Fetch the original form to calculate the score
        const [forms] = await db.query('SELECT fields FROM FormAssignments WHERE id = ?', [id]);
        if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
        
        let fields = forms[0].fields;
        if (typeof fields === 'string') fields = JSON.parse(fields);

        let totalGradable = 0;
        let earnedPoints = 0;

        // Calculate score
        fields.forEach(field => {
            // Only grade fields that have a correct_answer defined
            if (field.correct_answer && field.correct_answer.trim() !== '') {
                totalGradable += 1;
                const studentAnswer = answers[field.id];
                
                if (studentAnswer && studentAnswer.toString().trim().toLowerCase() === field.correct_answer.toString().trim().toLowerCase()) {
                    earnedPoints += 1;
                }
            }
        });

        const score_percentage = totalGradable > 0 ? (earnedPoints / totalGradable) * 100 : null;

        await db.query(
            'INSERT INTO FormSubmissions (form_id, student_id, answers, score_percentage) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE answers = ?, score_percentage = ?',
            [id, studentId, JSON.stringify(answers), score_percentage, JSON.stringify(answers), score_percentage]
        );

        // Notify teacher
        const notificationService = require('../services/notificationService');
        const [assignmentData] = await db.query(`
            SELECT f.title, c.teacher_id, c.class_name 
            FROM FormAssignments f 
            JOIN Classes c ON f.class_id = c.id 
            WHERE f.id = ?
        `, [id]);

        if (assignmentData.length > 0) {
            const { title, teacher_id, class_name } = assignmentData[0];
            
            // Fetch student name since it's not in req.user
            const [studentData] = await db.query('SELECT name FROM Users WHERE id = ?', [studentId]);
            const studentName = studentData.length > 0 ? studentData[0].name : 'A student';

            await notificationService.createNotification(
                teacher_id,
                'New Form Submission',
                `${studentName} submitted the form "${title}" for ${class_name}.`,
                'submission',
                id
            );
        }

        res.json({ message: 'Form submitted successfully', score: score_percentage });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getFormSubmissions = async (req, res) => {
    const { id } = req.params;
    const teacherId = req.user.id;

    try {
        // Verify teacher owns this form's class
        const [forms] = await db.query(`
            SELECT f.id 
            FROM FormAssignments f
            JOIN Classes c ON f.class_id = c.id
            WHERE f.id = ? AND c.teacher_id = ?
        `, [id, teacherId]);

        if (forms.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this form' });
        }

        const [submissions] = await db.query(`
            SELECT s.id, s.score_percentage, s.created_at, u.name, u.roll_number
            FROM FormSubmissions s
            JOIN Users u ON s.student_id = u.id
            WHERE s.form_id = ?
            ORDER BY s.created_at DESC
        `, [id]);

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ message: 'Server error fetching submissions' });
    }
};

module.exports = {
    getFormAssignments,
    getFormAssignmentById,
    createFormAssignment,
    submitFormAssignment,
    getFormSubmissions
};
