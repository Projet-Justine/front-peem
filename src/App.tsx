import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Main Pages
import DashboardPage from './pages/DashboardPage';
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import FilesPage from './pages/FilesPage';
import MeetingsPage from './pages/MeetingsPage';
import AcademicPage from './pages/AcademicPage';
import GradesPage from './pages/GradesPage';
import SocialPage from './pages/SocialPage';
import AdminPage from './pages/AdminPage';
import NotificationsPage from './pages/NotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Platform Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:id" element={<GroupDetailPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/academic" element={<AcademicPage />} />
              <Route path="/grades" element={<GradesPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/profile" element={<SocialPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Admin & Management Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['ADMIN', 'SCOLARITE', 'RESPONSABLE_FILIERE']}
                  />
                }
              >
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
