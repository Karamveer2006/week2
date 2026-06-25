const express = require('express');
const router = express.Router();
const { getNotices, createNotice } = require('../controllers/noticeController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, getNotices);
router.post('/', verifyToken, checkRole(['teacher']), createNotice);

module.exports = router;
