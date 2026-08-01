import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ClassroomDetail from './pages/ClassroomDetail';
import QuizAttempt from './pages/QuizAttempt';
import QuizResult from './pages/QuizResult';
import Analytics from './pages/Analytics';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

const ClassroomsRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'TEACHER') {
    return <Navigate to="/teacher-dashboard" replace />;
  }
  return <Navigate to="/student-dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/classrooms" element={<ClassroomsRedirect />} />
        <Route path="/classrooms/:id" element={<ClassroomDetail />} />
        <Route path="/quiz-attempt/:id" element={<QuizAttempt />} />
        <Route path="/quiz-result/:attemptId" element={<QuizResult />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Role-Specific Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
