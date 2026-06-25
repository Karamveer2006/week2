const express = require('express');
const router = express.Router();
const { getQRCode, markAttendanceQR, getAttendanceSheet, updateManualAttendance, getStudentAttendanceStats } = require('../controllers/attendanceController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/qr/:classId', verifyToken, checkRole(['teacher']), getQRCode);
router.post('/qr/mark', verifyToken, checkRole(['student']), markAttendanceQR);
router.get('/sheet', verifyToken, checkRole(['teacher']), getAttendanceSheet);
router.post('/manual', verifyToken, checkRole(['teacher']), updateManualAttendance);
router.get('/student/stats', verifyToken, checkRole(['student']), getStudentAttendanceStats);

module.exports = router;
