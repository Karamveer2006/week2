const db = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        await db.query('UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await db.query('UPDATE Notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const subscribe = async (req, res) => {
    const { endpoint, keys } = req.body;
    try {
        await db.query(
            'INSERT IGNORE INTO PushSubscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
            [req.user.id, endpoint, keys.p256dh, keys.auth]
        );
        res.status(201).json({ message: 'Subscribed' });
    } catch (error) {
        console.error('Error subscribing to push:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    subscribe
};
