import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

// Authenticated Pages
import { DashboardPage } from './pages/DashboardPage';
import { TodayChallengePage } from './pages/TodayChallengePage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ProgressPage } from './pages/ProgressPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReminderSettingsPage } from './pages/ReminderSettingsPage';
import { ProfilePage } from './pages/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminQuestionsPage } from './pages/admin/AdminQuestionsPage';
import { AdminEmailsPage } from './pages/admin/AdminEmailsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* User Authenticated Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/today" element={<TodayChallengePage />} />
            <Route path="/questions" element={<QuestionBankPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<ReminderSettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<Layout requireAdmin />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/emails" element={<AdminEmailsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
