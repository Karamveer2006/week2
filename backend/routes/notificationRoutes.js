const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, subscribe } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getNotifications);
router.put('/mark-all-read', verifyToken, markAllAsRead);
router.put('/:id/read', verifyToken, markAsRead);
router.post('/subscribe', verifyToken, subscribe);

module.exports = router;
