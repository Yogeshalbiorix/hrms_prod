import React, { useState } from 'react';
import { Menu, Avatar, Typography, Space, Tooltip, Button, Modal } from 'antd';
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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../Auth/AuthContext';

const { Text } = Typography;

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    Modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to logout?',
      okText: 'Yes, Logout',
      cancelText: 'Cancel',
      onOk: async () => {
        await logout();
      },
    });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: 'Employees',
    },
    {
      key: 'departments',
      icon: <BankOutlined />,
      label: 'Departments',
    },
    {
      key: 'attendance',
      icon: <CalendarOutlined />,
      label: 'Attendance & Leave',
    },
    {
      key: 'payroll',
      icon: <DollarOutlined />,
      label: 'Payroll',
    },
    {
      key: 'recruitment',
      icon: <SolutionOutlined />,
      label: 'Recruitment',
    },
    {
      key: 'performance',
      icon: <RiseOutlined />,
      label: 'Performance',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    onTabChange(e.key);
  };

  return (
    <aside
      className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
        }`}
      style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          {!collapsed && (
            <Space align="center">
              <Avatar
                style={{ backgroundColor: '#1890ff' }}
                size="large"
                icon={<TeamOutlined />}
              />
              <Text strong className="text-lg">
                HRMS
              </Text>
            </Space>
          )}
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </Tooltip>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={handleMenuClick}
            inlineCollapsed={collapsed}
            items={menuItems}
            className="border-0"
            style={{ height: '100%', borderRight: 0 }}
          />
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          {!collapsed && user && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Space vertical size={0} className="w-full">
                <Text type="secondary" className="text-xs">
                  Logged in as
                </Text>
                <Tooltip title={user.full_name}>
                  <Text strong className="text-sm block truncate">
                    {user.full_name}
                  </Text>
                </Tooltip>
                <Text type="secondary" className="text-xs capitalize">
                  {user.role}
                </Text>
              </Space>
            </div>
          )}
          <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
            <Button
              danger
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="w-full"
            >
              {!collapsed && 'Logout'}
            </Button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
