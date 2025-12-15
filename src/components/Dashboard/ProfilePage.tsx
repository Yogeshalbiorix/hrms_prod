import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Descriptions,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Timeline,
  Badge,
  Statistic,
  Tag
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EditOutlined,
  LockOutlined,
  IdcardOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '../Auth/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface EmployeeProfile {
  id: number;
  emp_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department_name?: string;
  join_date: string;
  base_salary?: number;
  status: string;
  address?: string;
  emergency_contact?: string;
}

interface AttendanceStats {
  total_days: number;
  present_days: number;
  average_hours: string;
  on_time_percentage: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
    fetchAttendanceStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');

      // Fetch user profile
      const userResponse = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const userData = await userResponse.json() as { success: boolean; user?: UserProfile };

      if (userData.success && userData.user) {
        setUserProfile(userData.user);
      }

      // Fetch employee profile if user has employee_id
      if (user?.employee_id) {
        const empResponse = await fetch(`/api/employees/${user.employee_id}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        const empData = await empResponse.json() as { success: boolean; data?: EmployeeProfile };

        if (empData.success && empData.data) {
          setEmployeeProfile(empData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      if (!user?.employee_id) return;

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/my-attendance?days=30', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const data = await response.json() as { success: boolean; data?: { statistics: AttendanceStats } };

      if (data.success && data.data?.statistics) {
        setAttendanceStats(data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        message.success('Profile updated successfully');
        setEditModalVisible(false);
        fetchProfile();
      } else {
        message.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        message.success('Password changed successfully');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        message.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      message.error('Failed to change password');
    }
  };

  if (loading && !userProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* Profile Header Card */}
        <Col span={24}>
          <Card>
            <Row gutter={24} align="middle">
              <Col>
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </Avatar>
              </Col>
              <Col flex="auto">
                <Space vertical size={4}>
                  <Title level={2} style={{ margin: 0 }}>
                    {userProfile?.full_name || 'User Name'}
                  </Title>
                  <Space>
                    <Tag color={userProfile?.role === 'admin' ? 'red' : 'blue'}>
                      {userProfile?.role?.toUpperCase() || 'EMPLOYEE'}
                    </Tag>
                    {employeeProfile && (
                      <Tag color="green">{employeeProfile.emp_code}</Tag>
                    )}
                    <Badge
                      status={userProfile?.is_active ? 'success' : 'error'}
                      text={userProfile?.is_active ? 'Active' : 'Inactive'}
                    />
                  </Space>
                  <Text type="secondary">
                    <MailOutlined /> {userProfile?.email || 'email@example.com'}
                  </Text>
                  {employeeProfile?.position && (
                    <Text type="secondary">
                      <IdcardOutlined /> {employeeProfile.position}
                    </Text>
                  )}
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                      form.setFieldsValue({
                        full_name: userProfile?.full_name,
                        email: userProfile?.email,
                      });
                      setEditModalVisible(true);
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    icon={<LockOutlined />}
                    onClick={() => setPasswordModalVisible(true)}
                  >
                    Change Password
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Stats Cards - Only for employees */}
        {employeeProfile && attendanceStats && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Days Present (30d)"
                  value={attendanceStats.present_days}
                  suffix={`/ ${attendanceStats.total_days}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Avg Hours/Day"
                  value={attendanceStats.average_hours}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="On-Time Rate"
                  value={attendanceStats.on_time_percentage}
                  suffix="%"
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Base Salary"
                  value={employeeProfile.base_salary || 0}
                  prefix={<DollarOutlined />}
                  precision={0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </>
        )}

        {/* Details Tabs */}
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Account Information" key="1">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Username" span={1}>
                    {userProfile?.username}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email" span={1}>
                    {userProfile?.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Full Name" span={1}>
                    {userProfile?.full_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Role" span={1}>
                    <Tag color={userProfile?.role === 'admin' ? 'red' : 'blue'}>
                      {userProfile?.role?.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Account Status" span={1}>
                    <Badge
                      status={userProfile?.is_active ? 'success' : 'error'}
                      text={userProfile?.is_active ? 'Active' : 'Inactive'}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Login" span={1}>
                    {userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString() : 'Never'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Account Created" span={2}>
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleString() : 'N/A'}
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              {employeeProfile && (
                <TabPane tab="Employee Information" key="2">
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Employee Code" span={1}>
                      <Tag color="green">{employeeProfile.emp_code}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Position" span={1}>
                      {employeeProfile.position}
                    </Descriptions.Item>
                    <Descriptions.Item label="Department" span={1}>
                      {employeeProfile.department_name || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Join Date" span={1}>
                      {new Date(employeeProfile.join_date).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone" span={1}>
                      {employeeProfile.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status" span={1}>
                      <Badge
                        status={employeeProfile.status === 'active' ? 'success' : 'error'}
                        text={employeeProfile.status.toUpperCase()}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Emergency Contact" span={2}>
                      {employeeProfile.emergency_contact || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      {employeeProfile.address || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </TabPane>
              )}

              <TabPane tab="Activity Log" key="3">
                <Timeline>
                  <Timeline.Item color="green">
                    <p>Account created</p>
                    <Text type="secondary">
                      {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleString() : 'N/A'}
                    </Text>
                  </Timeline.Item>
                  {userProfile?.last_login && (
                    <Timeline.Item color="blue">
                      <p>Last login</p>
                      <Text type="secondary">
                        {new Date(userProfile.last_login).toLocaleString()}
                      </Text>
                    </Timeline.Item>
                  )}
                  <Timeline.Item>
                    <p>Profile viewed</p>
                    <Text type="secondary">{new Date().toLocaleString()}</Text>
                  </Timeline.Item>
                </Timeline>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            label="Full Name"
            name="full_name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Profile
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="Current Password"
            name="current_password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            label="New Password"
            name="new_password"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            label="Confirm New Password"
            name="confirm_password"
            dependencies={['new_password']}
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
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
              <Button onClick={() => setPasswordModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
