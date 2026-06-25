const express = require('express');
const router = express.Router();
const { getNotes, createNote, deleteNote } = require('../controllers/noteController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { cloudUpload } = require('../middleware/upload');

// Fetch notes (Accessible to both teacher and student)
router.get('/', verifyToken, getNotes);

// Create note (Teacher only)
router.post('/', verifyToken, checkRole(['teacher']), cloudUpload.single('file'), createNote);

// Delete note (Teacher only)
router.delete('/:id', verifyToken, checkRole(['teacher']), deleteNote);

module.exports = router;
