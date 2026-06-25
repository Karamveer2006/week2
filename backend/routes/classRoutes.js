const express = require('express');
const router = express.Router();
const { getClasses, getTimetable, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry, createClass } = require('../controllers/classController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, getClasses);
router.post('/', verifyToken, checkRole(['teacher']), createClass);
router.get('/timetable', verifyToken, getTimetable);
router.post('/timetable', verifyToken, checkRole(['teacher']), addTimetableEntry);
router.put('/timetable/:id', verifyToken, checkRole(['teacher']), updateTimetableEntry);
router.delete('/timetable/:id', verifyToken, checkRole(['teacher']), deleteTimetableEntry);

module.exports = router;
