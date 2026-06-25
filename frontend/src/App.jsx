import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ChangePassword from './pages/auth/ChangePassword';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherSchedule from './pages/teacher/Schedule';
import ManualAttendance from './pages/teacher/ManualAttendance';
import QRDisplay from './pages/teacher/QRDisplay';
import ClassRoster from './pages/teacher/ClassRoster';
import TeacherAssignments from './pages/teacher/Assignments';

import StudentDashboard from './pages/student/Dashboard';
import StudentSchedule from './pages/student/Schedule';
import QRScanner from './pages/student/QRScanner';
import StudentAssignments from './pages/student/Assignments';
import Profile from './pages/common/Profile';
import Notes from './pages/common/Notes';
import FormBuilder from './pages/teacher/FormBuilder';
import FormListTeacher from './pages/teacher/FormList';
import FormListStudent from './pages/student/FormList';
import FormTake from './pages/student/FormTake';

import MainLayout from './components/layout/MainLayout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_first_login && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or unauthorized page
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            <Route path="/teacher/*" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Routes>
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="classes" element={<ClassRoster />} />
                  <Route path="schedule" element={<TeacherSchedule />} />
                  <Route path="attendance" element={<ManualAttendance />} />
                  <Route path="qr-display" element={<QRDisplay />} />
                  <Route path="assignments" element={<TeacherAssignments />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="dynamic-forms" element={<FormListTeacher />} />
                  <Route path="form-builder" element={<FormBuilder />} />
                  <Route path="form-builder/:id" element={<FormBuilder />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            } />

            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="schedule" element={<StudentSchedule />} />
                  <Route path="qr" element={<QRScanner />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="dynamic-forms" element={<FormListStudent />} />
                  <Route path="take-form/:id" element={<FormTake />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
