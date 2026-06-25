const db = require('../config/db');
const { generateQRToken, validateQRToken } = require('../services/qrService');

// Get QR Code Token for a class
const getQRCode = async (req, res) => {
    const { classId } = req.params;
    const teacherId = req.user.id;

    try {
        // Verify teacher owns this class
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [classId, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        const token = generateQRToken(classId, teacherId);
        res.json({ token, expiresIn: 15 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Student marks attendance via QR Code
const markAttendanceQR = async (req, res) => {
    const { token } = req.body;
    const studentId = req.user.id;

    try {
        const decoded = validateQRToken(token);
        if (!decoded) {
            return res.status(400).json({ message: 'Invalid or expired QR code' });
        }

        const { classId } = decoded;
        const date = new Date().toISOString().split('T')[0];

        // Check if student is in this class
        const [enrollment] = await db.query('SELECT * FROM Class_Students WHERE class_id = ? AND student_id = ?', [classId, studentId]);
        if (enrollment.length === 0) {
            return res.status(403).json({ message: 'Not enrolled in this class' });
        }

        // Insert or update attendance
        await db.query(
            `INSERT INTO Attendance (class_id, student_id, date, status, marked_by) 
             VALUES (?, ?, ?, 'Present', 'QR') 
             ON DUPLICATE KEY UPDATE status = 'Present', marked_by = 'QR'`,
            [classId, studentId, date]
        );

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Teacher fetches attendance layout
const getAttendanceSheet = async (req, res) => {
    const { classId, date } = req.query;
    const teacherId = req.user.id;

    try {
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [classId, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        const query = `
            SELECT u.id as student_id, u.name, u.roll_number, 
                   COALESCE(a.status, 'Absent') as status, a.marked_by
            FROM Class_Students cs
            JOIN Users u ON cs.student_id = u.id
            LEFT JOIN Attendance a ON a.student_id = u.id AND a.class_id = cs.class_id AND a.date = ?
            WHERE cs.class_id = ?
        `;
        const [students] = await db.query(query, [date, classId]);
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Teacher manually updates attendance
const updateManualAttendance = async (req, res) => {
    const { classId, date, studentId, status } = req.body;
    const teacherId = req.user.id;

    try {
        const [classes] = await db.query('SELECT * FROM Classes WHERE id = ? AND teacher_id = ?', [classId, teacherId]);
        if (classes.length === 0) {
            return res.status(403).json({ message: 'Not authorized for this class' });
        }

        await db.query(
            `INSERT INTO Attendance (class_id, student_id, date, status, marked_by) 
             VALUES (?, ?, ?, ?, 'Manual') 
             ON DUPLICATE KEY UPDATE status = ?, marked_by = 'Manual'`,
            [classId, studentId, date, status, status]
        );

        res.json({ message: 'Attendance updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Student fetches their own attendance stats
const getStudentAttendanceStats = async (req, res) => {
    const studentId = req.user.id;
    try {
        const [stats] = await db.query(`
            SELECT 
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as attended,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as missed
            FROM Attendance
            WHERE student_id = ?
        `, [studentId]);
        
        res.json({
            attended: parseInt(stats[0].attended || 0),
            missed: parseInt(stats[0].missed || 0)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getQRCode,
    markAttendanceQR,
    getAttendanceSheet,
    updateManualAttendance,
    getStudentAttendanceStats
};
