import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Spin,
  message,
  Divider,
  Avatar,
  Upload
} from 'antd';
import {
  UserOutlined,
  BankOutlined,
  BellOutlined,
  LockOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  DatabaseOutlined,
  SaveOutlined,
  CameraOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { baseUrl } from '../../lib/base-url';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Settings {
  company_name?: string;
  industry?: string;
  company_size?: string;
  address?: string;
  profile_first_name?: string;
  profile_last_name?: string;
  profile_email?: string;
  profile_job_title?: string;
  notifications?: {
    leave_requests?: boolean;
    attendance_alerts?: boolean;
    performance_reviews?: boolean;
    payroll_processing?: boolean;
    new_applications?: boolean;
  };
  theme_mode?: string;
  primary_color?: string;
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as any;
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      setSaving(true);
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json() as any;
      if (data.success) {
        setSettings(data.data);
        message.success('Settings saved successfully!');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <BankOutlined style={{ marginRight: 8 }} />
          General
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical">
            <Title level={4} style={{ marginBottom: 24, color: '#1e40af' }}>
              <BankOutlined style={{ marginRight: 8 }} />
              Company Information
            </Title>

            <Form.Item label="Company Name">
              <Input
                size="large"
                placeholder="Enter company name"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                prefix={<BankOutlined style={{ color: '#9ca3af' }} />}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Industry">
                  <Select
                    size="large"
                    value={settings.industry || 'Technology'}
                    onChange={(value) => setSettings({ ...settings, industry: value })}
                  >
                    <Option value="Technology">Technology</Option>
                    <Option value="Finance">Finance</Option>
                    <Option value="Healthcare">Healthcare</Option>
                    <Option value="Retail">Retail</Option>
                    <Option value="Manufacturing">Manufacturing</Option>
                    <Option value="Education">Education</Option>
                    <Option value="Consulting">Consulting</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Company Size">
                  <Select
                    size="large"
                    value={settings.company_size || '51-200'}
                    onChange={(value) => setSettings({ ...settings, company_size: value })}
                  >
                    <Option value="1-50">1-50 employees</Option>
                    <Option value="51-200">51-200 employees</Option>
                    <Option value="201-1000">201-1000 employees</Option>
                    <Option value="1000+">1000+ employees</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Address">
              <TextArea
                rows={3}
                placeholder="Company address"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </Form.Item>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => updateSettings(settings)}
              style={{ marginTop: 16 }}
            >
              Save Changes
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          Profile
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical">
            <Title level={4} style={{ marginBottom: 24, color: '#1e40af' }}>
              <UserOutlined style={{ marginRight: 8 }} />
              Personal Information
            </Title>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#3b82f6' }} />
              <div style={{ marginTop: 16 }}>
                <Button icon={<CameraOutlined />}>Change Photo</Button>
              </div>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="First Name">
                  <Input
                    size="large"
                    placeholder="First name"
                    value={settings.profile_first_name || ''}
                    onChange={(e) => setSettings({ ...settings, profile_first_name: e.target.value })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Last Name">
                  <Input
                    size="large"
                    placeholder="Last name"
                    value={settings.profile_last_name || ''}
                    onChange={(e) => setSettings({ ...settings, profile_last_name: e.target.value })}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Email">
              <Input
                size="large"
                type="email"
                placeholder="email@example.com"
                value={settings.profile_email || ''}
                onChange={(e) => setSettings({ ...settings, profile_email: e.target.value })}
              />
            </Form.Item>

            <Form.Item label="Job Title">
              <Input
                size="large"
                placeholder="Your job title"
                value={settings.profile_job_title || ''}
                onChange={(e) => setSettings({ ...settings, profile_job_title: e.target.value })}
              />
            </Form.Item>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => updateSettings(settings)}
              style={{ marginTop: 16 }}
            >
              Save Changes
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined style={{ marginRight: 8 }} />
          Notifications
        </span>
      ),
      children: (
        <Card>
          <Title level={4} style={{ marginBottom: 24, color: '#1e40af' }}>
            <BellOutlined style={{ marginRight: 8 }} />
            Notification Preferences
          </Title>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" style={{ background: '#f9fafb' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>Leave Requests</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Get notified when employees submit leave requests
                  </Text>
                </Col>
                <Col>
                  <Switch
                    checked={settings.notifications?.leave_requests}
                    onChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, leave_requests: checked },
                      })
                    }
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" style={{ background: '#f9fafb' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>Attendance Alerts</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Receive alerts for attendance anomalies
                  </Text>
                </Col>
                <Col>
                  <Switch
                    checked={settings.notifications?.attendance_alerts}
                    onChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, attendance_alerts: checked },
                      })
                    }
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" style={{ background: '#f9fafb' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>Performance Reviews</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Notifications about upcoming performance reviews
                  </Text>
                </Col>
                <Col>
                  <Switch
                    checked={settings.notifications?.performance_reviews}
                    onChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, performance_reviews: checked },
                      })
                    }
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" style={{ background: '#f9fafb' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>Payroll Processing</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Updates on payroll processing status
                  </Text>
                </Col>
                <Col>
                  <Switch
                    checked={settings.notifications?.payroll_processing}
                    onChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, payroll_processing: checked },
                      })
                    }
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" style={{ background: '#f9fafb' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>New Applications</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Get notified about new job applications
                  </Text>
                </Col>
                <Col>
                  <Switch
                    checked={settings.notifications?.new_applications}
                    onChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, new_applications: checked },
                      })
                    }
                  />
                </Col>
              </Row>
            </Card>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => updateSettings(settings)}
              style={{ marginTop: 16 }}
            >
              Save Preferences
            </Button>
          </Space>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <LockOutlined style={{ marginRight: 8 }} />
          Security
        </span>
      ),
      children: (
        <Card>
          <Title level={4} style={{ marginBottom: 24, color: '#1e40af' }}>
            <LockOutlined style={{ marginRight: 8 }} />
            Security Settings
          </Title>
          <Text type="secondary">Security settings will be available soon.</Text>
        </Card>
      ),
    },
    {
      key: 'appearance',
      label: (
        <span>
          <BgColorsOutlined style={{ marginRight: 8 }} />
          Appearance
        </span>
      ),
      children: (
        <Card>
          <Title level={4} style={{ marginBottom: 24, color: '#1e40af' }}>
            <BgColorsOutlined style={{ marginRight: 8 }} />
            Appearance Settings
          </Title>

          <Form layout="vertical">
            <Form.Item label="Theme Mode">
              <Select
                size="large"
                value={settings.theme_mode || 'light'}
                onChange={(value) => setSettings({ ...settings, theme_mode: value })}
              >
                <Option value="light">Light Mode</Option>
                <Option value="dark">Dark Mode</Option>
                <Option value="auto">Auto (System)</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Primary Color">
              <Input
                size="large"
                type="color"
                value={settings.primary_color || '#3b82f6'}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
              />
            </Form.Item>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => updateSettings(settings)}
              style={{ marginTop: 16 }}
            >
              Save Changes
            </Button>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: 8, color: '#1e40af' }}>
        <GlobalOutlined style={{ marginRight: 8 }} />
        Settings
      </Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Manage your application preferences
      </Text>

      <Tabs
        defaultActiveKey="general"
        size="large"
        items={tabItems}
        tabBarStyle={{ marginBottom: 24 }}
      />
    </div>
  );
}
