import React from 'react';
import { ConfigProvider, Spin, App as AntApp } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './Auth/AuthContext';
import LoginPage from './Auth/LoginPage';
import HRMSDashboard from './Dashboard/HRMSDashboard';
import UserDashboard from './Dashboard/UserDashboard';
import ResetPasswordPage from './Auth/ResetPasswordPage';

function AppContent() {
  const { user, isLoading } = useAuth();

  // Check if we're on the reset-password page
  if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
    return <ResetPasswordPage onBackToLogin={() => window.location.href = '/'} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Route based on user role
  if (user) {
    if (user.role === 'admin') {
      return <HRMSDashboard />;
    } else {
      return <UserDashboard />;
    }
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          controlHeight: 40,
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
