import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Tabs,
  Table,
  Tag,
  Modal
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        full_name: user.full_name,
        email: user.email,
        username: user.username,
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Profile updated successfully');
      } else {
        message.error((data as any).error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      message.error('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: values.current_password,
          newPassword: values.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Password changed successfully');
        passwordForm.resetFields();
      } else {
        message.error((data as any).error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      message.error('An error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const response = await fetch('/api/auth/audit-logs', {
        credentials: 'include',
      });

      const data = await response.json() as any;

      if (response.ok) {
        setAuditLogs(data.logs || []);
      } else {
        message.error('Failed to load audit logs');
      }
    } catch (error) {
      console.error('Audit logs error:', error);
      message.error('An error occurred while loading audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/auth/upload-profile-image',
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
      }
      return isImage && isLt2M;
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success('Profile image updated successfully');
      } else if (info.file.status === 'error') {
        message.error('Failed to upload profile image');
      }
    },
  };

  const auditColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colors: Record<string, string> = {
          LOGIN: 'green',
          LOGOUT: 'blue',
          PASSWORD_CHANGED: 'orange',
          PROFILE_UPDATED: 'cyan',
          PASSWORD_RESET_REQUESTED: 'purple',
          PASSWORD_RESET_COMPLETED: 'magenta',
          USER_REGISTERED: 'geekblue',
        };
        return <Tag color={colors[action] || 'default'}>{action.replace(/_/g, ' ')}</Tag>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string) => <Text code>{ip || 'N/A'}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
      <Title level={2}>
        <UserOutlined /> My Profile
      </Title>

      <Tabs defaultActiveKey="profile" size="large">
        <TabPane tab="Profile Information" key="profile">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Avatar
                    size={120}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <Upload {...uploadProps}>
                    <Button icon={<CameraOutlined />}>
                      Change Photo
                    </Button>
                  </Upload>
                  <Divider />
                  <Space direction="vertical" align="center">
                    <Title level={4} style={{ margin: 0 }}>{user.full_name}</Title>
                    <Text type="secondary">{user.role}</Text>
                    <Tag color="green">Active</Tag>
                  </Space>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card title="Personal Information">
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                  size="large"
                >
                  <Form.Item
                    name="full_name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="John Doe" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="john@example.com" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Phone Number"
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="+1 (555) 123-4567" />
                  </Form.Item>

                  <Form.Item
                    name="username"
                    label="Username"
                  >
                    <Input prefix={<UserOutlined />} disabled />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                      size="large"
                    >
                      Save Changes
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Change Password" key="password">
          <Card style={{ maxWidth: 600, margin: '0 auto' }}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
              size="large"
            >
              <Form.Item
                name="current_password"
                label="Current Password"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
              </Form.Item>

              <Form.Item
                name="new_password"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                    message: 'Password must contain letters and numbers'
                  }
                ]}
                hasFeedback
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="Confirm New Password"
                dependencies={['new_password']}
                hasFeedback
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="Activity Log" key="activity">
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4}>
                  <HistoryOutlined /> Recent Activity
                </Title>
                <Button onClick={loadAuditLogs} loading={auditLoading}>
                  Refresh
                </Button>
              </div>

              <Table
                dataSource={auditLogs}
                columns={auditColumns}
                loading={auditLoading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserProfile;
