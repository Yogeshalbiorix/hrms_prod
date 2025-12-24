import React, { useState, useEffect } from 'react';
import { Input, Badge, Avatar, Space, Typography, Dropdown, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  MailOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useAuth } from '../Auth/AuthContext';

const { Title, Text } = Typography;

interface HeaderProps {
  title: string;
  onMenuClick?: (key: string) => void;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  employee_id?: number;
  emp_code?: string;
  position?: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user: authUser, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchNotifications();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; user?: UserProfile; error?: string };

      if (data.success && data.user) {
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data?: Notification[] };

      if (data.success && data.data) {
        setNotifications(data.data.filter(n => !n.read).slice(0, 5));
      }
    } catch (error) {
      // Notifications optional
    }
  };

  const handleMenuClick = async (key: string) => {
    switch (key) {
      case 'profile':
        if (onMenuClick) onMenuClick('profile');
        break;
      case 'settings':
        if (onMenuClick) onMenuClick('settings');
        break;
      case 'logout':
        try {
          await logout();
          window.location.href = '/';
        } catch (error) {
          message.error('Logout failed');
        }
        break;
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const displayUser = userProfile || authUser;
  const unreadCount = notifications.length;
  const messagesCount = messages.length;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Title */}
        <div>
          <Title level={3} className="!mb-0">
            {title}
          </Title>
          <Text type="secondary" className="text-sm">
            Welcome back, {userProfile?.full_name || authUser?.full_name || 'Admin'}
          </Text>
        </div>

        {/* Right Section */}
        <Space size="middle">
          {/* Search Bar */}
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search employees, reports..."
            className="w-80 hidden md:block"
            size="large"
            allowClear
          />

          {/* Notification Icon */}
          <Tooltip title="Notifications">
            <Badge count={unreadCount} size="small" overflowCount={99}>
              <Avatar
                icon={<BellOutlined />}
                className="cursor-pointer hover:bg-blue-50"
                style={{ backgroundColor: '#f0f5ff', color: '#1890ff' }}
                onClick={() => onMenuClick?.('notifications')}
              />
            </Badge>
          </Tooltip>

          {/* Messages Icon */}
          <Tooltip title="Messages">
            <Badge count={messagesCount} size="small" overflowCount={99}>
              <Avatar
                icon={<MailOutlined />}
                className="cursor-pointer hover:bg-blue-50"
                style={{ backgroundColor: '#f0f5ff', color: '#1890ff' }}
              />
            </Badge>
          </Tooltip>

          {/* Settings Icon */}
          <Tooltip title="Settings">
            <Avatar
              icon={<SettingOutlined />}
              className="cursor-pointer hover:bg-blue-50"
              style={{ backgroundColor: '#f0f5ff', color: '#1890ff' }}
              onClick={() => handleMenuClick('settings')}
            />
          </Tooltip>

          {/* User Profile */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <Space className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors">
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
                size="large"
              >
                {displayUser?.full_name?.charAt(0) || displayUser?.username?.charAt(0) || 'U'}
              </Avatar>
              <div className="text-left hidden lg:block">
                <Text strong className="block text-sm">
                  {displayUser?.full_name || displayUser?.username || 'User'}
                </Text>
                <Text type="secondary" className="text-xs capitalize">
                  {displayUser?.position || displayUser?.role || 'Employee'}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </header>
  );
}
