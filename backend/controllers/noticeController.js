const db = require('../config/db');

const getNotices = async (req, res) => {
    try {
        let query = `
            SELECT n.*, u.name as teacher_name 
            FROM Notices n
            JOIN Users u ON n.created_by = u.id
        `;
        let params = [];
        
        if (req.user.role === 'teacher') {
            query += ' WHERE n.created_by = ?';
            params.push(req.user.id);
        } else if (req.user.role === 'student') {
            query += ` WHERE n.created_by IN (
                SELECT DISTINCT c.teacher_id 
                FROM Classes c 
                JOIN Class_Students cs ON c.id = cs.class_id 
                WHERE cs.student_id = ?
            )`;
            params.push(req.user.id);
        }
        
        query += ' ORDER BY n.created_at DESC';

        const [notices] = await db.query(query, params);
        res.json(notices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createNotice = async (req, res) => {
    const { title, content } = req.body;
    const teacherId = req.user.id;

    try {
        await db.query(
            'INSERT INTO Notices (created_by, title, content) VALUES (?, ?, ?)',
            [teacherId, title, content]
        );
        res.json({ message: 'Notice created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotices,
    createNotice
};
