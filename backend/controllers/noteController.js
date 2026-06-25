const db = require('../config/db');

const getNotes = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query = '';
        let params = [userId];

        if (role === 'teacher') {
            query = `
                SELECT n.*, c.class_name, c.subject_code 
                FROM Notes n
                JOIN Classes c ON n.class_id = c.id
                WHERE c.teacher_id = ?
                ORDER BY n.created_at DESC
            `;
        } else {
            query = `
                SELECT n.*, c.class_name, c.subject_code 
                FROM Notes n
                JOIN Classes c ON n.class_id = c.id
                JOIN Class_Students cs ON c.id = cs.class_id
                WHERE cs.student_id = ?
                ORDER BY n.created_at DESC
            `;
        }

        const [notes] = await db.query(query, params);
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error fetching notes' });
    }
};

const createNote = async (req, res) => {
    const { class_id, title, description } = req.body;
    const teacherId = req.user.id;
    const file_url = req.file ? req.file.path : null;

    if (!file_url) {
        return res.status(400).json({ message: 'A file must be uploaded' });
    }

    try {
        // Verify ownership of the class
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [class_id, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        await db.query(
            'INSERT INTO Notes (class_id, title, description, file_url) VALUES (?, ?, ?, ?)',
            [class_id, title, description, file_url]
        );

        res.json({ message: 'Note uploaded successfully' });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Server error creating note' });
    }
};

const deleteNote = async (req, res) => {
    const { id } = req.params;
    const teacherId = req.user.id;

    try {
        const [notes] = await db.query(`
            SELECT n.id 
            FROM Notes n
            JOIN Classes c ON n.class_id = c.id
            WHERE n.id = ? AND c.teacher_id = ?
        `, [id, teacherId]);

        if (notes.length === 0) {
            return res.status(403).json({ message: 'Not authorized to delete this note' });
        }

        await db.query('DELETE FROM Notes WHERE id = ?', [id]);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Server error deleting note' });
    }
};

module.exports = {
    getNotes,
    createNote,
    deleteNote
};
