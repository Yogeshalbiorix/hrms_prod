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
  App,
  Tabs,
  Table,
  Tag,
  Modal,
  Timeline,
  Statistic,
  Descriptions,
  Select
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  EditOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuth } from './AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number;
  sessions: number;
  status: string;
  notes?: string;
  location?: string;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_date: string;
  approved_by?: string;
  approved_date?: string;
}

interface EmployeeInfo {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  department_name?: string;
  join_date?: string;
  status: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  base_salary?: number;
}

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  employee_id?: number;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  employee_id?: number;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

export const UserProfile: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [employeeForm] = Form.useForm();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeEditModalVisible, setEmployeeEditModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
    loadAuditLogs();
  }, []);

  // Initialize form with profile data
  useEffect(() => {
    if (userProfile) {
      profileForm.setFieldsValue({
        full_name: userProfile.full_name,
        email: userProfile.email,
        username: userProfile.username,
      });

      // Fetch employee info if employee_id exists
      if (userProfile.employee_id) {
        fetchEmployeeInfo(userProfile.employee_id);
      }
    }
  }, [userProfile, profileForm]);

  const fetchUserProfile = async () => {
    setProfileLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; user?: UserProfileData; error?: string };

      if (result.success && result.user) {
        setUserProfile(result.user);
      } else {
        message.error(result.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      message.error('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchEmployeeInfo = async (employeeId: number) => {
    setEmployeeLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: EmployeeInfo; error?: string };

      if (result.success && result.data) {
        setEmployeeInfo(result.data);
      } else {
        console.log('Employee info not found or user is not an employee');
      }
    } catch (error) {
      console.error('Error fetching employee info:', error);
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
        }),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (response.ok || data.success) {
        message.success('Profile updated successfully');
        // Refresh profile data
        fetchUserProfile();
      } else {
        message.error(data.error || 'Failed to update profile');
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

  const handleEmployeeUpdate = async (values: any) => {
    if (!employeeInfo?.id) return;

    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/employees/${employeeInfo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        message.success('Employee information updated successfully');
        setEmployeeEditModalVisible(false);
        // Refresh employee info
        if (userProfile?.employee_id) {
          fetchEmployeeInfo(userProfile.employee_id);
        }
      } else {
        message.error(data.error || 'Failed to update employee information');
      }
    } catch (error) {
      console.error('Employee update error:', error);
      message.error('An error occurred while updating employee information');
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



  const loadMyAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const token = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/attendance/my-records?days=${selectedDays}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json() as { success: boolean; data?: { attendance_records: AttendanceRecord[]; leave_requests: LeaveRequest[] }; error?: string };

      if (response.ok && data.success) {
        setAttendanceRecords(data.data?.attendance_records || []);
        setLeaveRequests(data.data?.leave_requests || []);
      } else {
        message.error('Failed to load attendance data');
      }
    } catch (error) {
      console.error('Attendance load error:', error);
      message.error('An error occurred while loading attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    loadMyAttendance();
  }, [selectedDays]);

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'pending':
        return 'orange';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sick':
        return 'red';
      case 'vacation':
        return 'blue';
      case 'personal':
        return 'purple';
      case 'emergency':
        return 'orange';
      default:
        return 'default';
    }
  };

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

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', padding: '24px' }}>
        <Space direction="vertical" align="center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <Text>Loading profile...</Text>
        </Space>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="danger">Failed to load profile data. Please try refreshing the page.</Text>
            <br />
            <Button type="primary" onClick={fetchUserProfile} style={{ marginTop: '16px' }}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
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
              <Card loading={employeeLoading}>
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
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <Title level={4} style={{ margin: 0 }}>{user.full_name}</Title>
                    {employeeInfo?.employee_id && (
                      <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {employeeInfo.employee_id}
                      </Tag>
                    )}
                    <Text type="secondary">{employeeInfo?.position || user.role}</Text>
                    {(employeeInfo?.department || employeeInfo?.department_name) && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {employeeInfo.department_name || employeeInfo.department}
                      </Text>
                    )}
                    <Tag color="green">{employeeInfo?.status || 'Active'}</Tag>
                    {employeeInfo && (
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => {
                          employeeForm.setFieldsValue({
                            first_name: employeeInfo.first_name,
                            last_name: employeeInfo.last_name,
                            email: employeeInfo.email,
                            phone: employeeInfo.phone,
                            position: employeeInfo.position,
                            address: employeeInfo.address,
                            emergency_contact: employeeInfo.emergency_contact,
                          });
                          setEmployeeEditModalVisible(true);
                        }}
                      >
                        Edit Employee Info
                      </Button>
                    )}
                  </Space>
                </Space>
                {employeeInfo && (
                  <>
                    <Divider />
                    <Descriptions column={1} size="small">
                      {employeeInfo.join_date && (
                        <Descriptions.Item label="Join Date">
                          {dayjs(employeeInfo.join_date).format('MMM DD, YYYY')}
                        </Descriptions.Item>
                      )}
                      {employeeInfo.phone && (
                        <Descriptions.Item label="Phone">
                          {employeeInfo.phone}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Email">
                        {employeeInfo.email}
                      </Descriptions.Item>
                    </Descriptions>
                  </>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card title="Personal Information" loading={employeeLoading}>
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                  size="large"
                >
                  {employeeInfo?.employee_id && (
                    <Form.Item label="Employee Code">
                      <Input
                        value={employeeInfo.employee_id}
                        disabled
                        style={{ fontWeight: 600, color: '#1890ff' }}
                      />
                    </Form.Item>
                  )}
                  {employeeInfo?.position && (
                    <Form.Item label="Position">
                      <Input
                        value={employeeInfo.position}
                        disabled
                      />
                    </Form.Item>
                  )}
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

        <TabPane tab="Attendance & Leave" key="attendance">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Summary Statistics */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Total Days</span>}
                    value={attendanceRecords.length}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#fff', fontWeight: 700 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Total Hours</span>}
                    value={attendanceRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0).toFixed(1)}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#fff', fontWeight: 700 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Avg Hours/Day</span>}
                    value={attendanceRecords.length > 0
                      ? (attendanceRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0) / attendanceRecords.length).toFixed(1)
                      : '0.0'}
                    prefix={<FieldTimeOutlined />}
                    valueStyle={{ color: '#fff', fontWeight: 700 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Leave Requests</span>}
                    value={leaveRequests.length}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#fff', fontWeight: 700 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Filter and Refresh */}
            <Card>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space>
                    <span style={{ fontWeight: 500 }}>Show records for:</span>
                    <Select
                      value={selectedDays}
                      onChange={setSelectedDays}
                      style={{ width: 150 }}
                    >
                      <Select.Option value={7}>Last 7 days</Select.Option>
                      <Select.Option value={15}>Last 15 days</Select.Option>
                      <Select.Option value={30}>Last 30 days</Select.Option>
                      <Select.Option value={90}>Last 90 days</Select.Option>
                    </Select>
                  </Space>
                </Col>
                <Col>
                  <Button onClick={loadMyAttendance} loading={attendanceLoading}>
                    Refresh
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Attendance History */}
            <Card
              title={
                <span>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  My Attendance History
                </span>
              }
              loading={attendanceLoading}
            >
              {attendanceRecords.length > 0 ? (
                <Timeline mode="left">
                  {attendanceRecords.map((record) => (
                    <Timeline.Item
                      key={record.id}
                      color={
                        record.status === 'present' ? 'green' :
                          record.status === 'late' ? 'orange' :
                            record.status === 'absent' ? 'red' : 'blue'
                      }
                    >
                      <Card
                        size="small"
                        style={{ marginBottom: 12 }}
                        bodyStyle={{ padding: '12px 16px' }}
                      >
                        <Row gutter={[16, 8]} align="middle">
                          <Col xs={24} sm={6}>
                            <div>
                              <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                              <strong>{dayjs(record.date).format('MMM DD, YYYY')}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                              {dayjs(record.date).format('dddd')}
                            </div>
                          </Col>
                          <Col xs={24} sm={6}>
                            <div style={{ fontSize: 12, color: '#595959' }}>Clock In</div>
                            <div style={{ fontWeight: 500 }}>
                              {record.clock_in ? dayjs(record.clock_in).format('hh:mm A') : '-'}
                            </div>
                          </Col>
                          <Col xs={24} sm={6}>
                            <div style={{ fontSize: 12, color: '#595959' }}>Clock Out</div>
                            <div style={{ fontWeight: 500 }}>
                              {record.clock_out ? dayjs(record.clock_out).format('hh:mm A') : 'Working...'}
                            </div>
                          </Col>
                          <Col xs={24} sm={3}>
                            <div style={{ fontSize: 12, color: '#595959' }}>Total Hours</div>
                            <div style={{ fontWeight: 600, color: '#1890ff' }}>
                              {record.total_hours ? `${record.total_hours.toFixed(1)}h` : '-'}
                            </div>
                          </Col>
                          <Col xs={24} sm={3}>
                            <Tag
                              color={
                                record.status === 'present' ? 'green' :
                                  record.status === 'late' ? 'orange' :
                                    record.status === 'absent' ? 'red' : 'blue'
                              }
                              style={{ margin: 0 }}
                            >
                              {record.status?.toUpperCase()}
                            </Tag>
                          </Col>
                        </Row>
                        {record.notes && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                            <strong>Note:</strong> {record.notes}
                          </div>
                        )}
                        {record.location && (
                          <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                            <strong>Location:</strong> {record.location}
                          </div>
                        )}
                      </Card>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                  No attendance records found for the selected period
                </div>
              )}
            </Card>

            {/* Leave Requests */}
            <Card
              title={
                <span>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  My Leave Requests
                </span>
              }
              loading={attendanceLoading}
            >
              {leaveRequests.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {leaveRequests.map((leave) => (
                    <Card
                      key={leave.id}
                      size="small"
                      style={{ borderLeft: `4px solid ${getLeaveStatusColor(leave.status)}` }}
                    >
                      <Row gutter={[16, 12]}>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div>
                              <Tag color={getLeaveTypeColor(leave.leave_type)} style={{ marginRight: 8 }}>
                                {leave.leave_type.toUpperCase()}
                              </Tag>
                              <Tag color={getLeaveStatusColor(leave.status)}>
                                {leave.status.toUpperCase()}
                              </Tag>
                            </div>
                            <div>
                              <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                              <strong>
                                {dayjs(leave.start_date).format('MMM DD, YYYY')} - {dayjs(leave.end_date).format('MMM DD, YYYY')}
                              </strong>
                            </div>
                            <div style={{ fontSize: 13, color: '#595959' }}>
                              Duration: <strong>{leave.duration_days} day(s)</strong>
                            </div>
                          </Space>
                        </Col>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Reason:</div>
                              <div style={{ fontSize: 13 }}>{leave.reason}</div>
                            </div>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              Applied on: {dayjs(leave.applied_date).format('MMM DD, YYYY')}
                            </div>
                            {leave.approved_by && (
                              <div style={{ fontSize: 12, color: '#52c41a' }}>
                                <CheckCircleOutlined style={{ marginRight: 4 }} />
                                Approved by {leave.approved_by} on {dayjs(leave.approved_date).format('MMM DD, YYYY')}
                              </div>
                            )}
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                  No leave requests found
                </div>
              )}
            </Card>
          </Space>
        </TabPane>
      </Tabs>

      {/* Employee Edit Modal */}
      <Modal
        title="Edit Employee Information"
        open={employeeEditModalVisible}
        onCancel={() => setEmployeeEditModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={employeeForm}
          layout="vertical"
          onFinish={handleEmployeeUpdate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="first_name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="last_name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
              >
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Position"
            name="position"
            rules={[{ required: true, message: 'Please enter position' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
          >
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>
          <Form.Item
            label="Emergency Contact"
            name="emergency_contact"
          >
            <Input prefix={<PhoneOutlined />} placeholder="Name & Phone Number" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                Save Changes
              </Button>
              <Button onClick={() => setEmployeeEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
