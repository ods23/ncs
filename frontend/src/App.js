import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Box } from '@mui/material';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import StatisticsPage from './pages/StatisticsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import UserRegistrationPage from './pages/UserRegistrationPage';
import CodeRegistrationPage from './pages/CodeRegistrationPage';
import ScreenRegistrationPage from './pages/ScreenRegistrationPage';
import MenuRegistrationPage from './pages/MenuRegistrationPage';
import MenuUserRegistrationPage from './pages/MenuUserRegistrationPage';
import MenuPage from './pages/MenuPage';
import ScreenPage from './pages/ScreenPage';
import NewComerManagementPage from './pages/NewComerManagementPage';
import TransferBelieverManagementPage from './pages/TransferBelieverManagementPage';
import NewComerGraduateManagementPage from './pages/NewComerGraduateManagementPage';
import TransferGraduateManagementPage from './pages/TransferGraduateManagementPage';
import AllBelieverManagementPage from './pages/AllBelieverManagementPage';
import AllGraduateManagementPage from './pages/AllGraduateManagementPage';
import FileManagementPage from './pages/FileManagementPage';
import SystemConstantsPage from './pages/SystemConstantsPage';
import AdminPage from './pages/AdminPage';
import MyPageWithSidebar from './pages/MyPageWithSidebar';
import NewComerEducationManagementPage from './pages/NewComerEducationManagementPage';
import TransferBelieverEducationManagementPage from './pages/TransferBelieverEducationManagementPage';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Box sx={{ 
        pt: (user && window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/auth/callback' && window.location.pathname !== '/unauthorized') ? '50px' : 0 
      }}>
        {user && <Header />}
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/schedule" element={user ? <SchedulePage /> : <Navigate to="/login" />} />
          <Route path="/statistics" element={user ? <StatisticsPage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/login" />} />
          <Route path="/mypage" element={user ? <MyPageWithSidebar /> : <Navigate to="/login" />} />

          <Route path="/admin/user-registration" element={user ? <UserRegistrationPage /> : <Navigate to="/login" />} />
          <Route path="/admin/system-constants" element={user ? <SystemConstantsPage /> : <Navigate to="/login" />} />
          <Route path="/admin/code-registration" element={user ? <CodeRegistrationPage /> : <Navigate to="/login" />} />
                  <Route path="/admin/screen-registration" element={user ? <ScreenRegistrationPage /> : <Navigate to="/login" />} />
        <Route path="/admin/menu-registration" element={user ? <MenuRegistrationPage /> : <Navigate to="/login" />} />
        <Route path="/admin/menu-user-registration" element={user ? <MenuUserRegistrationPage /> : <Navigate to="/login" />} />
        <Route path="/admin/file-management" element={user ? <FileManagementPage /> : <Navigate to="/login" />} />
        <Route path="/new-comers" element={user ? <NewComerManagementPage /> : <Navigate to="/login" />} />
        <Route path="/transfer-believers" element={user ? <TransferBelieverManagementPage /> : <Navigate to="/login" />} />
        <Route path="/all-believer/register" element={user ? <AllBelieverManagementPage /> : <Navigate to="/login" />} />
        <Route path="/new-comer-graduate" element={user ? <NewComerGraduateManagementPage /> : <Navigate to="/login" />} />
        <Route path="/admin/transfer-believer-graduate" element={user ? <TransferGraduateManagementPage /> : <Navigate to="/login" />} />
        <Route path="/admin/all-graduate" element={user ? <AllGraduateManagementPage /> : <Navigate to="/login" />} />
        <Route path="/new-comer-education" element={user ? <NewComerEducationManagementPage /> : <Navigate to="/login" />} />
        <Route path="/transfer-believer-education" element={user ? <TransferBelieverEducationManagementPage /> : <Navigate to="/login" />} />
        <Route path="/transfer-believer/register" element={user ? <NewComerManagementPage /> : <Navigate to="/login" />} />
        <Route path="/transfer-believer-graduate" element={user ? <NewComerManagementPage /> : <Navigate to="/login" />} />
        <Route path="/menu/:menuId" element={user ? <MenuPage /> : <Navigate to="/login" />} />
        <Route path="/screen/:screenId" element={user ? <ScreenPage /> : <Navigate to="/login" />} />
        </Routes>
      </Box>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 