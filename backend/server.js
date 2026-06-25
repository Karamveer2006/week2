const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/form-assignments', require('./routes/formAssignmentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));

// Start background services
const { startCronJobs } = require('./services/cronService');
startCronJobs();

// Test DB Connection
const db = require('./config/db');
db.getConnection()
    .then(connection => {
        console.log('Database connected successfully.');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// Basic Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ClassFlow API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
