import React from 'react';
import { AuthProvider, useAuth } from './Auth/AuthContext';
import LoginPage from './Auth/LoginPage';
import HRMSDashboard from './Dashboard/HRMSDashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <HRMSDashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
