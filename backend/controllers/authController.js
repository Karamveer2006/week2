const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_first_login: user.is_first_login
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const [users] = await db.query('SELECT * FROM Users WHERE id = ?', [userId]);
        const user = users[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect old password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE Users SET password = ?, is_first_login = FALSE WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const signup = async (req, res) => {
    const { name, email, password, roll_number } = req.body;
    const role = 'teacher';

    try {
        const [existingUsers] = await db.query('SELECT * FROM Users WHERE email = ? OR roll_number = ?', [email, roll_number]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this email or ID already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query(
            `INSERT INTO Users (roll_number, name, email, password, role, is_first_login) VALUES (?, ?, ?, ?, ?, false)`,
            [roll_number, name, email, hashedPassword, role]
        );

        res.status(201).json({ message: 'Teacher registered successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    login,
    changePassword,
    signup
};
