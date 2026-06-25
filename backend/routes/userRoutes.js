const express = require('express');
const router = express.Router();
const { bulkUploadStudents, getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { localUpload } = require('../middleware/upload');

// Profile routes (accessible by any logged in user)
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/password', verifyToken, changePassword);

// Teacher only routes
router.post('/bulk-upload', verifyToken, checkRole(['teacher']), localUpload.single('file'), bulkUploadStudents);

module.exports = router;
