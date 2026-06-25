const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        }
    });

    console.log('Connected to TiDB. Adding missing tables...');

    await connection.query(`
        CREATE TABLE IF NOT EXISTS Notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50),
            related_id INT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        );
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS PushSubscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh VARCHAR(255) NOT NULL,
            auth VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            UNIQUE(user_id, endpoint(255))
        );
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS Notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            file_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE
        );
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS FormAssignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            header_image TEXT,
            fields JSON NOT NULL,
            due_date DATETIME NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE
        );
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS FormSubmissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            form_id INT NOT NULL,
            student_id INT NOT NULL,
            answers JSON NOT NULL,
            marks_awarded DECIMAL(5,2),
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES FormAssignments(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
            UNIQUE(form_id, student_id)
        );
    `);

    console.log('Missing tables added successfully.');
    await connection.end();
}

updateSchema().catch(console.error);
