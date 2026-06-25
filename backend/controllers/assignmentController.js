const db = require('../config/db');

const getAssignments = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query = '';
        let params = [userId];

        if (role === 'teacher') {
            query = `
                SELECT a.*, c.class_name, c.subject_code 
                FROM Assignments a
                JOIN Classes c ON a.class_id = c.id
                WHERE c.teacher_id = ?
            `;
        } else {
            query = `
                SELECT a.*, c.class_name, c.subject_code,
                       s.marks_awarded, s.file_url as submission_url
                FROM Assignments a
                JOIN Classes c ON a.class_id = c.id
                JOIN Class_Students cs ON c.id = cs.class_id
                LEFT JOIN Submissions s ON a.id = s.assignment_id AND s.student_id = ?
                WHERE cs.student_id = ?
            `;
            params = [userId, userId];
        }

        const [assignments] = await db.query(query, params);
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createAssignment = async (req, res) => {
    const { class_id, title, description, form_link, due_date } = req.body;
    const teacherId = req.user.id;
    const file_url = req.file ? req.file.path : null;

    try {
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [class_id, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        const [insertRes] = await db.query(
            'INSERT INTO Assignments (class_id, title, description, file_url, form_link, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [class_id, title, description, file_url, form_link, due_date]
        );

        // Notify students
        const notificationService = require('../services/notificationService');
        const [students] = await db.query('SELECT student_id FROM Class_Students WHERE class_id = ?', [class_id]);
        for (const student of students) {
            await notificationService.createNotification(
                student.student_id,
                'New Assignment',
                `A new assignment "${title}" has been posted for ${classes[0].class_name}.`,
                'assignment',
                insertRes.insertId
            );
        }

        res.json({ message: 'Assignment created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const submitAssignment = async (req, res) => {
    const { assignment_id } = req.body;
    const studentId = req.user.id;
    const file_url = req.file ? req.file.path : null;

    if (!file_url) {
        return res.status(400).json({ message: 'Submission file required' });
    }

    try {
        const [insertRes] = await db.query(
            'INSERT INTO Submissions (assignment_id, student_id, file_url) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE file_url = ?',
            [assignment_id, studentId, file_url, file_url]
        );

        // Notify teacher
        const notificationService = require('../services/notificationService');
        const [assignmentData] = await db.query(`
            SELECT a.title, c.teacher_id, c.class_name 
            FROM Assignments a 
            JOIN Classes c ON a.class_id = c.id 
            WHERE a.id = ?
        `, [assignment_id]);

        if (assignmentData.length > 0) {
            const { title, teacher_id, class_name } = assignmentData[0];
            
            // Fetch student name since it's not in req.user
            const [studentData] = await db.query('SELECT name FROM Users WHERE id = ?', [studentId]);
            const studentName = studentData.length > 0 ? studentData[0].name : 'A student';

            await notificationService.createNotification(
                teacher_id,
                'New Assignment Submission',
                `${studentName} submitted the assignment "${title}" for ${class_name}.`,
                'submission',
                assignment_id
            );
        }

        res.json({ message: 'Assignment submitted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getStudentGradeHistory = async (req, res) => {
    const studentId = req.user.id;

    try {
        const [grades] = await db.query(`
            SELECT a.title as name, s.marks_awarded as score
            FROM Submissions s
            JOIN Assignments a ON s.assignment_id = a.id
            WHERE s.student_id = ? AND s.marks_awarded IS NOT NULL
            ORDER BY a.due_date ASC
            LIMIT 10
        `, [studentId]);

        // Fallback to empty if no grades
        res.json(grades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching grades' });
    }
};

const getAssignmentSubmissions = async (req, res) => {
    const { id } = req.params;
    const teacherId = req.user.id;

    try {
        const [assignments] = await db.query(`
            SELECT a.id FROM Assignments a
            JOIN Classes c ON a.class_id = c.id
            WHERE a.id = ? AND c.teacher_id = ?
        `, [id, teacherId]);

        if (assignments.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this assignment' });
        }

        const [submissions] = await db.query(`
            SELECT s.*, u.name, u.roll_number, u.email 
            FROM Submissions s
            JOIN Users u ON s.student_id = u.id
            WHERE s.assignment_id = ?
        `, [id]);

        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching submissions' });
    }
};

const markSubmission = async (req, res) => {
    const { id } = req.params;
    let { marks } = req.body;
    const teacherId = req.user.id;

    if (marks === '') marks = null;

    try {
        const [submissions] = await db.query(`
            SELECT s.id FROM Submissions s
            JOIN Assignments a ON s.assignment_id = a.id
            JOIN Classes c ON a.class_id = c.id
            WHERE s.id = ? AND c.teacher_id = ?
        `, [id, teacherId]);

        if (submissions.length === 0) {
            return res.status(403).json({ message: 'Not authorized to mark this submission' });
        }

        await db.query('UPDATE Submissions SET marks_awarded = ? WHERE id = ?', [marks, id]);
        res.json({ message: 'Submission marked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error marking submission' });
    }
};

module.exports = {
    getAssignments,
    createAssignment,
    submitAssignment,
    getStudentGradeHistory,
    getAssignmentSubmissions,
    markSubmission
};
