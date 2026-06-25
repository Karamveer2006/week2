const db = require('../config/db');

const getTeacherStats = async (req, res) => {
    const teacherId = req.user.id;

    try {
        // 1. Total Classes
        const [[{ totalClasses }]] = await db.query(
            'SELECT COUNT(*) as totalClasses FROM Classes WHERE teacher_id = ?', 
            [teacherId]
        );

        // 2. Active Students
        const [[{ activeStudents }]] = await db.query(`
            SELECT COUNT(DISTINCT cs.student_id) as activeStudents 
            FROM Class_Students cs 
            JOIN Classes c ON cs.class_id = c.id 
            WHERE c.teacher_id = ?
        `, [teacherId]);

        // 3. Pending Assignments
        const [[{ pendingAssignments }]] = await db.query(`
            SELECT COUNT(*) as pendingAssignments 
            FROM Assignments a 
            JOIN Classes c ON a.class_id = c.id 
            WHERE c.teacher_id = ? AND a.due_date >= CURDATE()
        `, [teacherId]);

        // 4. Avg Attendance (Proper calculation using class enrollments)
        const [[{ presentCount }]] = await db.query(`
            SELECT SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as presentCount
            FROM Attendance a
            JOIN Classes c ON a.class_id = c.id
            WHERE c.teacher_id = ?
        `, [teacherId]);

        const [[{ totalExpected }]] = await db.query(`
            SELECT SUM(enrolled_count) as totalExpected
            FROM (
                SELECT a.class_id, COUNT(cs.student_id) as enrolled_count
                FROM (
                    SELECT DISTINCT a.class_id, a.date 
                    FROM Attendance a
                    JOIN Classes c ON a.class_id = c.id
                    WHERE c.teacher_id = ?
                ) a
                JOIN Class_Students cs ON a.class_id = cs.class_id
                GROUP BY a.class_id, a.date
            ) AS expected
        `, [teacherId]);

        let avgAttendance = 0;
        if (totalExpected && totalExpected > 0) {
            avgAttendance = Math.round(((presentCount || 0) / totalExpected) * 100);
        }

        // 5. Attendance Trends (Last 7 Days)
        const [trendsDataRaw] = await db.query(`
            SELECT 
                DATE_FORMAT(a.date, '%b %d') as name,
                a.class_id,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as presentCount
            FROM Attendance a
            JOIN Classes c ON a.class_id = c.id
            WHERE c.teacher_id = ? AND a.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY a.date, a.class_id
            ORDER BY a.date ASC
        `, [teacherId]);

        const [enrollmentCountsRaw] = await db.query(`
            SELECT cs.class_id, COUNT(cs.student_id) as enrolledCount
            FROM Class_Students cs
            JOIN Classes c ON cs.class_id = c.id
            WHERE c.teacher_id = ?
            GROUP BY cs.class_id
        `, [teacherId]);

        const enrollmentMap = {};
        enrollmentCountsRaw.forEach(r => enrollmentMap[r.class_id] = r.enrolledCount);

        const dateMap = {}; 
        trendsDataRaw.forEach(row => {
            if (!dateMap[row.name]) {
                dateMap[row.name] = { present: 0, total: 0 };
            }
            dateMap[row.name].present += parseInt(row.presentCount || 0);
            dateMap[row.name].total += parseInt(enrollmentMap[row.class_id] || 0);
        });

        let finalTrendsData = Object.keys(dateMap).map(name => ({
            name,
            value: dateMap[name].present,
            absent: Math.max(0, dateMap[name].total - dateMap[name].present)
        }));

        // Fallback dummy data if no attendance records exist yet to avoid empty charts
        if (finalTrendsData.length === 0) {
            finalTrendsData = [
                { name: 'Mon', value: 0, absent: 0 }, 
                { name: 'Tue', value: 0, absent: 0 }, 
                { name: 'Wed', value: 0, absent: 0 }
            ];
        }

        // 6. Grade Distribution
        // Standard mapping: A >= 90, B >= 80, C >= 70, D >= 60, F < 60
        const [grades] = await db.query(`
            SELECT s.marks_awarded
            FROM Submissions s
            JOIN Assignments a ON s.assignment_id = a.id
            JOIN Classes c ON a.class_id = c.id
            WHERE c.teacher_id = ? AND s.marks_awarded IS NOT NULL
        `, [teacherId]);

        let gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        grades.forEach(g => {
            const m = g.marks_awarded;
            if (m >= 90) gradeCounts.A++;
            else if (m >= 80) gradeCounts.B++;
            else if (m >= 70) gradeCounts.C++;
            else if (m >= 60) gradeCounts.D++;
            else gradeCounts.F++;
        });

        const gradeDistribution = [
            { name: 'A', count: gradeCounts.A },
            { name: 'B', count: gradeCounts.B },
            { name: 'C', count: gradeCounts.C },
            { name: 'D', count: gradeCounts.D },
            { name: 'F', count: gradeCounts.F }
        ];

        res.json({
            totalClasses,
            activeStudents,
            pendingAssignments,
            avgAttendance,
            attendanceTrends: finalTrendsData,
            gradeDistribution
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

module.exports = {
    getTeacherStats
};
