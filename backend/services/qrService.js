const jwt = require('jsonwebtoken');

// Generate a QR code token that expires in 15 seconds
const generateQRToken = (classId, teacherId) => {
    return jwt.sign(
        { classId, teacherId, type: 'attendance_qr' },
        process.env.JWT_SECRET,
        { expiresIn: '15s' }
    );
};

// Validate QR code token
const validateQRToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'attendance_qr') {
            return null;
        }
        return decoded;
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateQRToken,
    validateQRToken
};
