const cron = require('node-cron');
const db = require('../config/db');
const notificationService = require('./notificationService');

const startCronJobs = () => {
    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily reminder cron job...');
        
        try {
            // Find assignments due in the next 24 hours
            const [assignments] = await db.query(`
                SELECT a.id, a.title, a.due_date, c.class_name, cs.student_id
                FROM Assignments a
                JOIN Classes c ON a.class_id = c.id
                JOIN Class_Students cs ON c.id = cs.class_id
                LEFT JOIN Submissions s ON a.id = s.assignment_id AND cs.student_id = s.student_id
                WHERE a.due_date IS NOT NULL 
                  AND a.due_date > NOW() 
                  AND a.due_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
                  AND s.id IS NULL
            `);

            for (const a of assignments) {
                await notificationService.createNotification(
                    a.student_id,
                    'Assignment Due Soon!',
                    `Your assignment "${a.title}" for ${a.class_name} is due tomorrow.`,
                    'assignment',
                    a.id
                );
            }

            // Find form assignments due in the next 24 hours
            const [forms] = await db.query(`
                SELECT f.id, f.title, f.due_date, c.class_name, cs.student_id
                FROM FormAssignments f
                JOIN Classes c ON f.class_id = c.id
                JOIN Class_Students cs ON c.id = cs.class_id
                LEFT JOIN FormSubmissions s ON f.id = s.form_id AND cs.student_id = s.student_id
                WHERE f.due_date IS NOT NULL 
                  AND f.due_date > NOW() 
                  AND f.due_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
                  AND s.id IS NULL
            `);

            for (const f of forms) {
                await notificationService.createNotification(
                    f.student_id,
                    'Form Due Soon!',
                    `Your dynamic form "${f.title}" for ${f.class_name} is due tomorrow.`,
                    'form',
                    f.id
                );
            }

            console.log('Daily reminders sent successfully.');
        } catch (error) {
            console.error('Error running daily cron job:', error);
        }
    });
};

module.exports = { startCronJobs };
