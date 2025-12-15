import React from 'react';
import { ConfigProvider, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './Auth/AuthContext';
import LoginPage from './Auth/LoginPage';
import HRMSDashboard from './Dashboard/HRMSDashboard';
import UserDashboard from './Dashboard/UserDashboard';

function AppContent() {
  const { user, isLoading } = useAuth();

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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
  );
}
