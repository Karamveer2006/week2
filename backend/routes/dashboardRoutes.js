const express = require('express');
const router = express.Router();
const { getTeacherStats } = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/teacher/stats', verifyToken, checkRole(['teacher']), getTeacherStats);

module.exports = router;
