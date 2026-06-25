const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seed() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            },
            multipleStatements: true
        });

        console.log('Connected to MySQL. Creating schema...');
        
        const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
        await connection.query(schema);

        await connection.query('USE smart_campus');

        console.log('Inserting mock data...');

        // Create teacher
        const hashedTeacherPw = await bcrypt.hash('teacher123', 10);
        const [teacherRes] = await connection.query(
            `INSERT IGNORE INTO Users (roll_number, name, email, password, role, is_first_login) 
             VALUES (?, ?, ?, ?, 'teacher', false)`,
            ['T001', 'Dr. Smith', 'smith@campus.edu', hashedTeacherPw]
        );
        const teacherId = teacherRes.insertId || 1; // Basic assumption

        // Create student
        const hashedStudentPw = await bcrypt.hash('student123', 10);
        const [studentRes] = await connection.query(
            `INSERT IGNORE INTO Users (roll_number, name, email, password, role, is_first_login) 
             VALUES (?, ?, ?, ?, 'student', false)`,
            ['S101', 'John Doe', 'john@campus.edu', hashedStudentPw]
        );
        const studentId = studentRes.insertId || 2;

        // Create class
        await connection.query(
            `INSERT IGNORE INTO Classes (class_name, subject_code, teacher_id) 
             VALUES ('Computer Science 101', 'CS101', ?)`,
            [teacherId]
        );

        // Map student to class
        await connection.query(
            `INSERT IGNORE INTO Class_Students (class_id, student_id) VALUES (1, ?)`,
            [studentId]
        );

        // Add timetable
        await connection.query(
            `INSERT IGNORE INTO Timetables (class_id, day_of_week, start_time, end_time, room_number) 
             VALUES (1, 'Monday', '09:00:00', '10:30:00', 'Room 402')`
        );

        console.log('Mock data inserted successfully!');
        console.log('--------------------------------');
        console.log('Teacher Login: smith@campus.edu / teacher123');
        console.log('Student Login: john@campus.edu / student123');
        console.log('--------------------------------');

        await connection.end();
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

seed();
