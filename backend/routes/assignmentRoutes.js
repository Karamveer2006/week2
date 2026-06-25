const express = require('express');
const router = express.Router();
const { getAssignments, createAssignment, submitAssignment, getStudentGradeHistory, getAssignmentSubmissions, markSubmission } = require('../controllers/assignmentController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { cloudUpload } = require('../middleware/upload');

router.get('/', verifyToken, getAssignments);
router.post('/', verifyToken, checkRole(['teacher']), cloudUpload.single('file'), createAssignment);
router.post('/submit', verifyToken, checkRole(['student']), cloudUpload.single('file'), submitAssignment);
router.get('/student/grades', verifyToken, checkRole(['student']), getStudentGradeHistory);
router.get('/:id/submissions', verifyToken, checkRole(['teacher']), getAssignmentSubmissions);
router.put('/submissions/:id/mark', verifyToken, checkRole(['teacher']), markSubmission);

module.exports = router;
