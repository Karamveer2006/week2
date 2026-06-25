CREATE DATABASE IF NOT EXISTS smart_campus;
USE smart_campus;

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NULL, -- Nullable for teachers
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL,
    is_first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    teacher_id INT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE(class_name, subject_code)
);

CREATE TABLE Class_Students (
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    PRIMARY KEY (class_id, student_id),
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(50),
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE
);

CREATE TABLE Assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url TEXT, -- PDF URL
    form_link TEXT, -- External form link
    due_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE
);

CREATE TABLE Submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    file_url TEXT, -- PDF upload
    marks_awarded DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES Assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE Attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL,
    marked_by ENUM('QR', 'Manual') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE(class_id, student_id, date)
);

CREATE TABLE Notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    class_id INT NULL, -- Nullable for global notices
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Personal_Notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
