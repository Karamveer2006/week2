const db = require('../config/db');

// Get all classes for a user (teacher or student)
const getClasses = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query = '';
        let params = [userId];

        if (role === 'teacher') {
            query = 'SELECT * FROM Classes WHERE teacher_id = ?';
        } else {
            query = `
                SELECT c.* 
                FROM Classes c
                JOIN Class_Students cs ON c.id = cs.class_id
                WHERE cs.student_id = ?
            `;
        }

        const [classes] = await db.query(query, params);
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get timetable for a user
const getTimetable = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query = '';
        let params = [userId];

        if (role === 'teacher') {
            query = `
                SELECT t.*, c.class_name, c.subject_code 
                FROM Timetables t
                JOIN Classes c ON t.class_id = c.id
                WHERE c.teacher_id = ?
            `;
        } else {
            query = `
                SELECT t.*, c.class_name, c.subject_code 
                FROM Timetables t
                JOIN Classes c ON t.class_id = c.id
                JOIN Class_Students cs ON c.id = cs.class_id
                WHERE cs.student_id = ?
            `;
        }

        const [timetables] = await db.query(query, params);
        res.json(timetables);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Teacher adds a timetable entry
const addTimetableEntry = async (req, res) => {
    const { class_id, day_of_week, start_time, end_time, room_number } = req.body;
    const teacherId = req.user.id;

    try {
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [class_id, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        await db.query(
            'INSERT INTO Timetables (class_id, day_of_week, start_time, end_time, room_number) VALUES (?, ?, ?, ?, ?)',
            [class_id, day_of_week, start_time, end_time, room_number]
        );

        res.json({ message: 'Timetable entry added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create class
const createClass = async (req, res) => {
    const { class_name, subject_code } = req.body;
    const teacherId = req.user.id;
    try {
        await db.query(
            'INSERT INTO Classes (class_name, subject_code, teacher_id) VALUES (?, ?, ?)',
            [class_name, subject_code, teacherId]
        );
        res.json({ message: 'Class created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Teacher updates a timetable entry
const updateTimetableEntry = async (req, res) => {
    const { id } = req.params;
    const { class_id, day_of_week, start_time, end_time, room_number } = req.body;
    const teacherId = req.user.id;

    try {
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [class_id, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        const [timetables] = await db.query(`
            SELECT t.id FROM Timetables t
            JOIN Classes c ON t.class_id = c.id
            WHERE t.id = ? AND c.teacher_id = ?
        `, [id, teacherId]);

        if (timetables.length === 0) {
             return res.status(403).json({ message: 'Not authorized for this timetable entry' });
        }

        await db.query(
            'UPDATE Timetables SET class_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room_number = ? WHERE id = ?',
            [class_id, day_of_week, start_time, end_time, room_number, id]
        );

        res.json({ message: 'Timetable entry updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Teacher deletes a timetable entry
const deleteTimetableEntry = async (req, res) => {
    const { id } = req.params;
    const teacherId = req.user.id;

    try {
        const [timetables] = await db.query(`
            SELECT t.id FROM Timetables t
            JOIN Classes c ON t.class_id = c.id
            WHERE t.id = ? AND c.teacher_id = ?
        `, [id, teacherId]);

        if (timetables.length === 0) {
             return res.status(403).json({ message: 'Not authorized for this timetable entry' });
        }

        await db.query('DELETE FROM Timetables WHERE id = ?', [id]);

        res.json({ message: 'Timetable entry deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getClasses,
    getTimetable,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    createClass
};
