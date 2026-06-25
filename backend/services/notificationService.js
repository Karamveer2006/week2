const db = require('../config/db');
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:admin@smartcampus.edu',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class NotificationService {
    async createNotification(userId, title, message, type = 'general', relatedId = null) {
        try {
            // Save to DB
            const [result] = await db.query(
                'INSERT INTO Notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
                [userId, title, message, type, relatedId]
            );

            // Attempt to send push notification
            await this.sendPushNotification(userId, {
                title,
                body: message,
                type,
                relatedId
            });

            return result.insertId;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    async sendPushNotification(userId, payload) {
        try {
            const [subs] = await db.query('SELECT * FROM PushSubscriptions WHERE user_id = ?', [userId]);
            
            for (const sub of subs) {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                try {
                    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
                } catch (error) {
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        // Subscription expired or unsubscribed
                        await db.query('DELETE FROM PushSubscriptions WHERE id = ?', [sub.id]);
                    } else {
                        console.error('Error sending push notification:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching subscriptions for push:', error);
        }
    }
}

module.exports = new NotificationService();
