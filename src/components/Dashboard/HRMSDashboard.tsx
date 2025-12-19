import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Badge, Button, theme, App, ConfigProvider } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
  SolutionOutlined,
  RiseOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ApartmentOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useAuth } from '../Auth/AuthContext';
import DashboardOverviewDynamic from './DashboardOverviewDynamic';
import EmployeeManagement from './EmployeeManagement';
import DepartmentManagement from './DepartmentManagement';
import AttendanceLeave from './AttendanceLeaveWrapper';
import AdminAttendanceView from './AdminAttendanceView';
import AdminActivityRequests from './AdminActivityRequests';
import PayrollManagement from './PayrollManagementDynamic';
import RecruitmentModule from './RecruitmentModule';
import PerformanceManagement from './PerformanceManagement';
import NotificationsActivity from './NotificationsActivity';
import Settings from './Settings';
import ProfilePage from './ProfilePage';
import OrganizationDirectory from './OrganizationDirectory';
import OrganizationHierarchy from './OrganizationHierarchy';
import MyTeam from './MyTeam';
import TeamAssignment from './TeamAssignment';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function HRMSDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return savedTheme || 'light';
    }
    return 'light';
  });
  const { user, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Listen for theme changes from Settings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        if (e.newValue === 'auto') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setCurrentTheme(isDark ? 'dark' : 'light');
        } else {
          setCurrentTheme(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event for same-tab updates
    const handleThemeChange = ((e: CustomEvent) => {
      const newTheme = e.detail.theme;
      if (newTheme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setCurrentTheme(isDark ? 'dark' : 'light');
      } else {
        setCurrentTheme(newTheme);
      }
    }) as EventListener;

    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Theme color configurations
  const themeColors = {
    light: {
      siderBg: '#ffffff',
      siderBorder: '1px solid #e5e7eb',
      logoBg: '#f8fafc',
      logoBorder: '1px solid #e5e7eb',
      logoText: '#1e293b',
      menuTheme: 'light' as const,
      headerBg: '#2c3e50',
      headerText: '#ffffff',
      headerSecondary: '#94a3b8',
      contentBg: '#f5f7fa',
      iconColor: '#ffffff',
    },
    dark: {
      siderBg: '#1f2937',
      siderBorder: '1px solid #374151',
      logoBg: '#111827',
      logoBorder: '1px solid #374151',
      logoText: '#f9fafb',
      menuTheme: 'dark' as const,
      headerBg: '#111827',
      headerText: '#f9fafb',
      headerSecondary: '#9ca3af',
      contentBg: '#0f172a',
      iconColor: '#f9fafb',
    },
  };

  const colors = themeColors[currentTheme as keyof typeof themeColors];

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      employees: 'Employee Management',
      departments: 'Department Management',
      attendance: 'Attendance & Leave Management',
      activityrequests: 'Activity Requests',
      organization: 'Organization Directory',
      hierarchy: 'Organization Hierarchy',
      myteam: 'My Team',
      teamassignment: 'Team Assignment',
      payroll: 'Payroll Management',
      recruitment: 'Recruitment',
      performance: 'Performance Management',
      notifications: 'Notifications & Activity',
      settings: 'Settings',
      profile: 'My Profile',
    };
    return titles[activeTab] || 'Dashboard';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverviewDynamic onNavigate={setActiveTab} />;
      case 'employees':
        return <EmployeeManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'attendance':
        return <AttendanceLeave />;
      case 'activityrequests':
        return <AdminActivityRequests />;
      case 'organization':
        return <OrganizationDirectory />;
      case 'hierarchy':
        return <OrganizationHierarchy />;
      case 'myteam':
        return <MyTeam />;
      case 'teamassignment':
        return <TeamAssignment />;
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
        return <DashboardOverviewDynamic onNavigate={setActiveTab} />;
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined style={{ fontSize: '18px' }} />,
      label: 'Dashboard',
    },
    {
      key: 'employees',
      icon: <TeamOutlined style={{ fontSize: '18px' }} />,
      label: 'Employees',
    },
    {
      key: 'departments',
      icon: <BankOutlined style={{ fontSize: '18px' }} />,
      label: 'Departments',
    },
    {
      key: 'attendance',
      icon: <CalendarOutlined style={{ fontSize: '18px' }} />,
      label: 'Attendance & Leave',
    },
    {
      key: 'activityrequests',
      icon: <SolutionOutlined style={{ fontSize: '18px' }} />,
      label: 'Activity Requests',
    },
    {
      key: 'organization',
      icon: <TeamOutlined style={{ fontSize: '18px' }} />,
      label: 'Organization',
    },
    {
      key: 'hierarchy',
      icon: <ApartmentOutlined style={{ fontSize: '18px' }} />,
      label: 'Hierarchy',
    },
    {
      key: 'myteam',
      icon: <TeamOutlined style={{ fontSize: '18px' }} />,
      label: 'My Team',
    },
    {
      key: 'teamassignment',
      icon: <UserAddOutlined style={{ fontSize: '18px' }} />,
      label: 'Assign Team',
    },
    {
      key: 'payroll',
      icon: <DollarOutlined style={{ fontSize: '18px' }} />,
      label: 'Payroll',
    },
    {
      key: 'recruitment',
      icon: <SolutionOutlined style={{ fontSize: '18px' }} />,
      label: 'Recruitment',
    },
    {
      key: 'performance',
      icon: <RiseOutlined style={{ fontSize: '18px' }} />,
      label: 'Performance',
    },
    {
      key: 'notifications',
      icon: <BellOutlined style={{ fontSize: '18px' }} />,
      label: 'Notifications',
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ fontSize: '18px' }} />,
      label: 'Settings',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => setActiveTab('profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => setActiveTab('settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <App>
        <Layout style={{ minHeight: '100vh' }}>
          {/* Sidebar */}
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              background: colors.siderBg,
              borderRight: colors.siderBorder,
              transition: 'all 0.3s ease',
            }}
          >
            {/* Logo Section */}
            <div
              style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0' : '0 24px',
                background: colors.logoBg,
                borderBottom: colors.logoBorder,
                transition: 'all 0.3s ease',
              }}
            >
              {collapsed ? (
                <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              ) : (
                <Space>
                  <DashboardOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
                  <Title level={4} style={{ margin: 0, color: colors.logoText, fontWeight: 700 }}>
                    HRMS Pro
                  </Title>
                </Space>
              )}
            </div>

            {/* Menu */}
            <Menu
              theme={colors.menuTheme}
              mode="inline"
              selectedKeys={[activeTab]}
              items={menuItems}
              onClick={(e) => setActiveTab(e.key)}
              style={{
                background: 'transparent',
                border: 'none',
                marginTop: 16,
                transition: 'all 0.3s ease',
              }}
            />
          </Sider>

          {/* Main Layout */}
          <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
            {/* Header */}
            <Header
              style={{
                padding: '0 24px',
                background: colors.headerBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: currentTheme === 'dark' ? '0 2px 8px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.3)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                transition: 'all 0.3s ease',
                height: '64px',
              }}
            >
              <Space size="large" align="center">
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    fontSize: '18px',
                    width: 48,
                    height: 48,
                    color: colors.iconColor,
                  }}
                />
                <Title level={3} style={{ margin: 0, fontWeight: 600, color: colors.headerText, lineHeight: '64px' }}>
                  {getPageTitle()}
                </Title>
              </Space>

              <Space size="large" align="center">
                <Badge count={5} offset={[-5, 5]}>
                  <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: '20px', color: colors.iconColor }} />}
                    onClick={() => setActiveTab('notifications')}
                    style={{ width: 48, height: 48 }}
                  />
                </Badge>

                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                  <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' }} align="center">
                    <Avatar
                      size={40}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                    <div style={{ lineHeight: 1.2 }}>
                      <Text strong style={{ display: 'block', fontSize: '14px', color: colors.headerText }}>
                        {user?.full_name || `${user?.first_name || 'Admin'} ${user?.last_name || 'User'}`}
                      </Text>
                      <Text style={{ fontSize: '12px', color: colors.headerSecondary, display: 'block', marginTop: '2px' }}>
                        {user?.role || 'Administrator'}
                      </Text>
                    </div>
                  </Space>
                </Dropdown>
              </Space>
            </Header>

            {/* Content */}
            <Content
              style={{
                margin: '20px',
                padding: '20px',
                minHeight: 'calc(100vh - 104px)',
                background: colors.contentBg,
                borderRadius: borderRadiusLG,
                transition: 'all 0.3s ease',
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
