const db = require('../config/db');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const fs = require('fs');

const bulkUploadStudents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { class_id } = req.body;

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const errors = [];
        let successCount = 0;

        for (const row of data) {
            const { Name, Email, RollNumber } = row;
            
            if (!Name || !Email || !RollNumber) {
                errors.push({ row, error: 'Missing required fields (Name, Email, RollNumber)' });
                continue;
            }

            try {
                let studentId;
                // Check if user exists
                const [existing] = await db.query('SELECT * FROM Users WHERE email = ? OR roll_number = ?', [Email, RollNumber]);
                
                if (existing.length > 0) {
                    studentId = existing[0].id;
                } else {
                    // Default password is Roll Number
                    const hashedPassword = await bcrypt.hash(String(RollNumber), 10);
                    const [result] = await db.query(
                        'INSERT INTO Users (name, email, roll_number, password, role, is_first_login) VALUES (?, ?, ?, ?, ?, ?)',
                        [Name, Email, RollNumber, hashedPassword, 'student', true]
                    );
                    studentId = result.insertId;
                }

                if (class_id) {
                    await db.query(
                        'INSERT IGNORE INTO Class_Students (class_id, student_id) VALUES (?, ?)',
                        [class_id, studentId]
                    );
                }
                
                successCount++;
            } catch (err) {
                console.error('Error inserting user:', err);
                errors.push({ row, error: 'Database error during insertion' });
            }
        }

        // Clean up file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Bulk upload completed',
            successCount,
            errors
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({ message: 'Failed to process file' });
    }
};

const getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, roll_number, role FROM Users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

const updateProfile = async (req, res) => {
    const { name, email, roll_number } = req.body;
    try {
        await db.query(
            'UPDATE Users SET name = ?, email = ?, roll_number = ? WHERE id = ?',
            [name, email, roll_number, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both current and new password' });
    }

    try {
        const [users] = await db.query('SELECT password FROM Users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE Users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error changing password' });
    }
};

module.exports = {
    bulkUploadStudents,
    getProfile,
    updateProfile,
    changePassword
};
