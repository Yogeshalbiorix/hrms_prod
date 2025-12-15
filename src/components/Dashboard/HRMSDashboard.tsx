import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardOverviewDynamic from './DashboardOverviewDynamic';
import EmployeeManagement from './EmployeeManagement';
import DepartmentManagement from './DepartmentManagement';
import AttendanceLeave from './AttendanceLeaveWrapper';
import AdminAttendanceView from './AdminAttendanceView';
import PayrollManagement from './PayrollManagementDynamic';
import RecruitmentModule from './RecruitmentModule';
import PerformanceManagement from './PerformanceManagement';
import NotificationsActivity from './NotificationsActivity';
import Settings from './Settings';
import ProfilePage from './ProfilePage';

export default function HRMSDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleHeaderMenuClick = (menuKey: string) => {
    setActiveTab(menuKey);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'employees':
        return 'Employee Management';
      case 'departments':
        return 'Department Management';
      case 'attendance':
        return 'Attendance & Leave Management';
      case 'payroll':
        return 'Payroll Management';
      case 'recruitment':
        return 'Recruitment';
      case 'performance':
        return 'Performance Management';
      case 'notifications':
        return 'Notifications & Activity';
      case 'settings':
        return 'Settings';
      case 'profile':
        return 'My Profile';
      default:
        return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverviewDynamic />;
      case 'employees':
        return <EmployeeManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'attendance':
        return <AdminAttendanceView />;
      case 'payroll':
        return <PayrollManagement />;
      case 'recruitment':
        return <RecruitmentModule />;
      case 'performance':
        return <PerformanceManagement />;
      case 'notifications':
        return <NotificationsActivity />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardOverviewDynamic />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title={getPageTitle()} onMenuClick={handleHeaderMenuClick} />

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
