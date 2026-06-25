const express = require('express');
const router = express.Router();
const { getFormAssignments, getFormAssignmentById, createFormAssignment, submitFormAssignment, getFormSubmissions } = require('../controllers/formAssignmentController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, getFormAssignments);
router.get('/:id', verifyToken, getFormAssignmentById);
router.get('/:id/submissions', verifyToken, checkRole(['teacher']), getFormSubmissions);
router.post('/', verifyToken, checkRole(['teacher']), createFormAssignment);
router.post('/:id/submit', verifyToken, checkRole(['student']), submitFormAssignment);

module.exports = router;
