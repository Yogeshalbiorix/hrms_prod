import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Avatar, Dropdown, Button, Typography, Space, Calendar, Badge, List, message, Table, Tag, Progress, Drawer, Timeline, Divider, Modal, Input, Spin } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  DollarOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined as ClockOutIcon,
  FieldTimeOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  HourglassOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../Auth/AuthContext';

// Lazy load components
const ProfilePage = lazy(() => import('./ProfilePage'));
const Settings = lazy(() => import('./Settings'));

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('attendance');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [clockInModalVisible, setClockInModalVisible] = useState(false);
  const [clockOutModalVisible, setClockOutModalVisible] = useState(false);
  const [clockInNotes, setClockInNotes] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Timer for elapsed time since clock-in
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isClockedIn && todayRecord?.clock_in) {
      interval = setInterval(() => {
        const clockInTime = todayRecord.clock_in;
        const [hours, minutes, seconds] = clockInTime.split(':').map(Number);
        const clockInDate = new Date();
        clockInDate.setHours(hours, minutes, seconds, 0);

        const now = new Date();
        const diff = Math.floor((now.getTime() - clockInDate.getTime()) / 1000);
        setElapsedTime(diff > 0 ? diff : 0);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, todayRecord]);

  const fetchAttendanceData = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/my-attendance', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: any; error?: string };
      if (result.success) {
        setAttendanceData(result.data);
        setTodayRecord(result.data.today);
        setIsClockedIn(result.data.today && !result.data.today.clock_out);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Try to get address using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json() as any;
            const address = data.display_name || 'Unknown location';
            resolve({ latitude, longitude, address });
          } catch (error) {
            resolve({ latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
          }
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
      );
    });
  };

  const showClockInModal = () => {
    setClockInModalVisible(true);
  };

  const handleClockInConfirm = async () => {
    setLoading(true);
    try {
      // Get user location
      const location = await getLocation();

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          work_mode: 'office',
          latitude: location.latitude,
          longitude: location.longitude,
          location_address: location.address,
          notes: clockInNotes
        })
      });
      const result = await response.json() as any;
      console.log('Clock-in response:', result);
      if (result.success) {
        message.success(`${result.message} - Location tracked`);
        setIsClockedIn(true);
        fetchAttendanceData();
        setClockInModalVisible(false);
        setClockInNotes('');
      } else {
        console.error('Clock-in error:', result.error);
        message.error(result.error || 'Failed to clock in');
      }
    } catch (error: any) {
      console.error('Clock-in exception:', error);
      // Handle geolocation errors (code 1 = permission denied, code 3 = timeout)
      if (error.code === 1) {
        message.warning('Location permission denied. Clocking in without location.');
      } else if (error.code === 3) {
        message.warning('Location request timed out. Clocking in without location.');
      } else if (error.message === 'Geolocation is not supported') {
        message.warning('Location not supported. Clocking in without location.');
      }

      // Clock in without location for any location error
      try {
        const sessionToken = localStorage.getItem('sessionToken');
        const response = await fetch('/api/attendance/clock-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ work_mode: 'office', notes: clockInNotes })
        });
        const result = await response.json() as any;
        console.log('Clock-in without location response:', result);
        if (result.success) {
          message.success(result.message);
          setIsClockedIn(true);
          fetchAttendanceData();
          setClockInModalVisible(false);
          setClockInNotes('');
        } else {
          console.error('Clock-in error:', result.error);
          message.error(result.error || 'Failed to clock in');
        }
      } catch (err) {
        console.error('Clock-in exception:', err);
        message.error('Failed to clock in: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
    setLoading(false);
  };

  const showClockOutModal = () => {
    setClockOutModalVisible(true);
  };

  const handleClockOutConfirm = async () => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          notes: clockOutNotes
        })
      });
      const result = await response.json() as any;
      if (result.success) {
        message.success(result.message);
        setIsClockedIn(false);
        fetchAttendanceData();
        setClockOutModalVisible(false);
        setClockOutNotes('');
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('Failed to clock out');
    }
    setLoading(false);
  };

  const fetchDayDetails = async (date: string) => {
    setDetailsLoading(true);
    setDrawerVisible(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/attendance/day-details?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: any };
      if (result.success) {
        setSelectedDayDetails(result.data);
      } else {
        message.error('Failed to load details');
      }
    } catch (error) {
      message.error('Error loading day details');
    }
    setDetailsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
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
      onClick: handleLogout,
    },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'My Attendance',
    },
    {
      key: 'leave',
      icon: <CalendarOutlined />,
      label: 'Leave Requests',
    },
    {
      key: 'payroll',
      icon: <DollarOutlined />,
      label: 'Payroll',
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: 'Documents',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  // Generate recent activities from attendance data
  const recentActivities = React.useMemo(() => {
    const activities: any[] = [];

    if (todayRecord && isClockedIn) {
      activities.push({
        title: 'Clocked In',
        time: `Today, ${todayRecord.clock_in}`,
        type: 'success'
      });
    }

    if (attendanceData?.records) {
      const recentRecords = attendanceData.records.slice(0, 5);
      recentRecords.forEach((record: any) => {
        if (record.date !== new Date().toISOString().split('T')[0]) {
          const date = new Date(record.date);
          const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isLate = record.sessions?.some((s: any) => s.notes?.includes('Late'));

          activities.push({
            title: `Attendance: ${record.working_hours || 'Partial'}`,
            time: timeStr,
            type: isLate ? 'warning' : 'success'
          });
        }
      });
    }

    return activities.slice(0, 5);
  }, [attendanceData, todayRecord, isClockedIn]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'HRMS' : 'HRMS Portal'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          onClick={({ key }) => setSelectedMenu(key)}
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            Welcome, {user?.full_name || user?.username}!
          </Title>

          <Space size="large">
            <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>{user?.full_name || user?.username}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{user?.role || 'Employee'}</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          {selectedMenu === 'home' && (
            <div>
              {/* Welcome Section */}
              <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Row align="middle">
                  <Col flex="auto">
                    <Title level={3} style={{ color: 'white', margin: 0 }}>
                      Welcome back, {user?.full_name || user?.username}! 👋
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                      {currentTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </Col>
                  <Col>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '16px 24px',
                      borderRadius: 8,
                      textAlign: 'center'
                    }}>
                      <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', display: 'block' }}>
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {isClockedIn ? '🟢 Active' : '⚪ Not Clocked In'}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Stats Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Days Present"
                      value={attendanceData?.statistics?.present_days || 0}
                      suffix={`/ ${attendanceData?.statistics?.total_days || 0}`}
                      valueStyle={{ color: '#3f8600' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Average Hours"
                      value={attendanceData?.statistics?.average_hours || '0h 0m'}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<FieldTimeOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="On-Time %"
                      value={attendanceData?.statistics?.on_time_percentage || 100}
                      suffix="%"
                      valueStyle={{ color: '#faad14' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Today's Hours"
                      value={(() => {
                        const hours = Math.floor(elapsedTime / 3600);
                        const minutes = Math.floor((elapsedTime % 3600) / 60);
                        return `${hours}h ${minutes}m`;
                      })()}
                      valueStyle={{ color: isClockedIn ? '#52c41a' : '#999' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Main Content Row */}
              <Row gutter={[16, 16]}>
                {/* Calendar */}
                <Col xs={24} lg={16}>
                  <Card title="Attendance Calendar" bordered={false}>
                    <Calendar
                      fullscreen={false}
                      dateCellRender={(date) => {
                        const dateStr = date.format('YYYY-MM-DD');
                        const record = attendanceData?.records?.find((r: any) => r.date === dateStr);

                        if (record) {
                          const isLate = record.sessions?.some((s: any) => s.notes?.includes('Late'));
                          const hasActive = record.has_active_session;

                          if (hasActive) {
                            return <Badge status="processing" text="Active" />;
                          } else if (isLate) {
                            return <Badge status="warning" text="Late" />;
                          } else if (record.status === 'present') {
                            return <Badge status="success" text="Present" />;
                          } else if (record.status === 'absent') {
                            return <Badge status="error" text="Absent" />;
                          }
                        }
                        return null;
                      }}
                    />
                  </Card>
                </Col>

                {/* Recent Activities */}
                <Col xs={24} lg={8}>
                  <Card title="Recent Activities" bordered={false}>
                    <List
                      dataSource={recentActivities}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Badge status={item.type as any} />
                            }
                            title={item.title}
                            description={item.time}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>

                  <Card
                    title="Quick Actions"
                    bordered={false}
                    style={{ marginTop: 16 }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        block
                        icon={<ClockCircleOutlined />}
                      >
                        Mark Attendance
                      </Button>
                      <Button
                        block
                        icon={<CalendarOutlined />}
                      >
                        Request Leave
                      </Button>
                      <Button
                        block
                        icon={<FileTextOutlined />}
                      >
                        View Payslip
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {selectedMenu === 'attendance' && (
            <div>
              {/* Top Section - Stats, Timings, Actions */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {/* Attendance Stats */}
                <Col xs={24} lg={8}>
                  <Card
                    title={<><ClockCircleOutlined /> Attendance Stats</>}
                    bordered={false}
                    style={{ height: '100%' }}
                  >
                    <div style={{ marginBottom: 24 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>PERIOD</Text>
                      <br />
                      <Text strong>Last Week</Text>
                    </div>

                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ padding: 16, backgroundColor: '#f0f5ff', borderRadius: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>AVG HRS / DAY</Text>
                          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                            {attendanceData?.statistics?.average_hours || '0h 0m'}
                          </Title>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ padding: 16, backgroundColor: '#f6ffed', borderRadius: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>ON TIME ARRIVAL</Text>
                          <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                            {attendanceData?.statistics?.on_time_percentage || 0}%
                          </Title>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* Timings - Today's Schedule */}
                <Col xs={24} lg={8}>
                  <Card
                    title={<><FieldTimeOutlined /> Timings</>}
                    bordered={false}
                    style={{ height: '100%' }}
                  >
                    {/* Week Days */}
                    <div style={{ marginBottom: 16 }}>
                      <Space size={8}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: idx === currentTime.getDay() - 1 || (idx === 6 && currentTime.getDay() === 0) ? '#1890ff' : '#f0f0f0',
                              color: idx === currentTime.getDay() - 1 || (idx === 6 && currentTime.getDay() === 0) ? 'white' : '#666',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: 12
                            }}
                          >
                            {day}
                          </div>
                        ))}
                      </Space>
                    </div>

                    {/* Today's Schedule */}
                    {todayRecord && (
                      <>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Today ({todayRecord.clock_in || '--:--'} - {todayRecord.clock_out || '7:30 PM'})
                        </Text>
                        <div style={{ marginTop: 8, marginBottom: 12 }}>
                          <Progress
                            percent={(() => {
                              // Expected work: 8 hours (480 minutes)
                              const expectedMinutes = 480;
                              const workedMinutes = elapsedTime / 60;
                              const percentage = Math.min(100, (workedMinutes / expectedMinutes) * 100);
                              return Math.round(percentage);
                            })()}
                            showInfo={true}
                            strokeColor={{
                              '0%': '#52c41a',
                              '50%': '#1890ff',
                              '100%': '#faad14'
                            }}
                            format={(percent) => `${Math.floor((elapsedTime / 60) / 60)}h ${Math.floor((elapsedTime / 60) % 60)}m`}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>Target: 8h 0m (+ 1h lunch)</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {isClockedIn ? '🟢 Working' : '⚪ Not Clocked In'}
                          </Text>
                        </div>
                      </>
                    )}
                  </Card>
                </Col>

                {/* Actions */}
                <Col xs={24} lg={8}>
                  <Card title={<>Actions</>} bordered={false} style={{ height: '100%' }}>
                    {/* Live Clock */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <Title level={1} style={{ margin: 0, fontSize: 40, fontWeight: 'bold' }}>
                        {currentTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </Title>
                      <Text type="secondary">
                        {currentTime.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </div>

                    {/* Clock In/Out Button */}
                    {!isClockedIn ? (
                      <Button
                        type="primary"
                        size="large"
                        block
                        onClick={showClockInModal}
                        loading={loading}
                        style={{ marginBottom: 12 }}
                      >
                        Web Clock-in
                      </Button>
                    ) : (
                      <Button
                        danger
                        size="large"
                        block
                        onClick={showClockOutModal}
                        loading={loading}
                        style={{ marginBottom: 12 }}
                      >
                        Web Clock-out
                      </Button>
                    )}

                    {/* Time Details */}
                    <div style={{ marginTop: 16 }}>
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>ELAPSED TIME</Text>
                          <br />
                          <Text strong style={{ fontSize: 18, color: isClockedIn ? '#52c41a' : '#666' }}>
                            {(() => {
                              const hours = Math.floor(elapsedTime / 3600);
                              const minutes = Math.floor((elapsedTime % 3600) / 60);
                              const seconds = elapsedTime % 60;
                              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            })()}
                          </Text>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>STATUS</Text>
                          <br />
                          <Text strong style={{ color: isClockedIn ? '#52c41a' : '#ff4d4f' }}>
                            {isClockedIn ? '🟢 Active' : '🔴 Inactive'}
                          </Text>
                        </Col>
                        {todayRecord && (
                          <>
                            <Col span={12}>
                              <Text type="secondary" style={{ fontSize: 11 }}>CLOCK IN</Text>
                              <br />
                              <Text strong>{todayRecord.clock_in || '--:--:--'}</Text>
                            </Col>
                            <Col span={12}>
                              <Text type="secondary" style={{ fontSize: 11 }}>CLOCK OUT</Text>
                              <br />
                              <Text strong>{todayRecord.clock_out || '--:--:--'}</Text>
                            </Col>
                          </>
                        )}
                      </Row>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ marginTop: 16 }}>
                      <Space vertical style={{ width: '100%', fontSize: 12 }} size={4}>
                        <a href="#" style={{ color: '#1890ff' }}>🏠 Work From Home</a>
                        <a href="#" style={{ color: '#1890ff' }}>📋 On Duty</a>
                        <a href="#" style={{ color: '#1890ff' }}>⏰ Partial Day Request</a>
                        <a href="#" style={{ color: '#1890ff' }}>📜 Attendance Policy</a>
                      </Space>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Logs & Requests Section */}
              <Card
                title={<strong>Logs & Requests</strong>}
                bordered={false}
                extra={
                  <Space>
                    <Button type="primary">30 DAYS</Button>
                    <Button type="text">NOV</Button>
                    <Button type="text">OCT</Button>
                    <Button type="text">SEP</Button>
                    <Button type="text">AUG</Button>
                    <Button type="text">JUL</Button>
                    <Button type="text">JUN</Button>
                  </Space>
                }
              >
                {/* Tabs */}
                <div style={{ borderBottom: '2px solid #f0f0f0', marginBottom: 16 }}>
                  <Space size={32}>
                    <Button type="link" style={{ fontWeight: 'bold', color: '#1890ff', borderBottom: '2px solid #1890ff' }}>
                      Attendance Log
                    </Button>
                    <Button type="link" style={{ color: '#666' }}>Calendar</Button>
                    <Button type="link" style={{ color: '#666' }}>Attendance Requests</Button>
                  </Space>
                </div>

                <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>Last 30 Days</Text>

                <Table
                  dataSource={attendanceData?.records || []}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    {
                      title: 'DATE',
                      dataIndex: 'date',
                      key: 'date',
                      width: 180,
                      render: (date: string, record: any) => {
                        const d = new Date(date);
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                        return (
                          <div>
                            <Text strong>{dayName}, {dateStr}</Text>
                            {record.session_count > 1 && (
                              <div>
                                <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                                  {record.session_count} Sessions
                                </Tag>
                              </div>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'ATTENDANCE VISUAL',
                      key: 'visual',
                      width: 300,
                      render: (_: any, record: any) => {
                        if (!record.clock_in) return <Text type="secondary">-</Text>;

                        const clockIn = record.clock_in;
                        const clockOut = record.clock_out;

                        // Calculate position and width for visual bar
                        const startHour = parseInt(clockIn.split(':')[0]);
                        const startMin = parseInt(clockIn.split(':')[1]);
                        const startPercent = ((startHour * 60 + startMin) / (24 * 60)) * 100;

                        let endPercent = 100;
                        if (clockOut) {
                          const endHour = parseInt(clockOut.split(':')[0]);
                          const endMin = parseInt(clockOut.split(':')[1]);
                          endPercent = ((endHour * 60 + endMin) / (24 * 60)) * 100;
                        }

                        const width = endPercent - startPercent;

                        return (
                          <div style={{ position: 'relative', height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: `${startPercent}%`,
                                width: `${width}%`,
                                height: '100%',
                                backgroundColor: clockOut ? '#52c41a' : '#1890ff',
                                borderRadius: 4
                              }}
                            />
                            {record.notes?.includes('Late') && (
                              <div style={{ position: 'absolute', left: `${startPercent - 2}%`, top: -2 }}>
                                <span style={{ fontSize: 16 }}>⚠️</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'EFFECTIVE HOURS',
                      dataIndex: 'working_hours',
                      key: 'effective_hours',
                      width: 120,
                      render: (hours: string) => (
                        <Text>{hours || '0h 0m+'}</Text>
                      )
                    },
                    {
                      title: 'GROSS HOURS',
                      dataIndex: 'working_hours',
                      key: 'gross_hours',
                      width: 120,
                      render: (hours: string) => (
                        <Text>{hours || '0h 0m+'}</Text>
                      )
                    },
                    {
                      title: 'ARRIVAL',
                      key: 'arrival',
                      width: 120,
                      render: (_: any, record: any) => {
                        if (record.status === 'absent') return <Text>-</Text>;
                        const isLate = record.sessions?.some((s: any) => s.notes?.includes('Late'));
                        const lateNote = record.sessions?.find((s: any) => s.notes?.includes('Late'))?.notes;
                        return (
                          <div>
                            <span style={{ fontSize: 18 }}>{isLate ? '😟' : '✅'}</span>
                            {isLate && lateNote && (
                              <>
                                <br />
                                <Text type="danger" style={{ fontSize: 11 }}>
                                  {lateNote.match(/\d+/)?.[0] || '0'} min late
                                </Text>
                              </>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'LOG',
                      key: 'log',
                      width: 60,
                      render: (_: any, record: any) => (
                        <Button
                          type="text"
                          icon={<span style={{ color: '#faad14', fontSize: 16 }}>ℹ️</span>}
                          onClick={() => fetchDayDetails(record.date)}
                        />
                      )
                    }
                  ]}
                />
              </Card>

              {/* Detailed Day Log Drawer */}
              <Drawer
                title={
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      Attendance Details
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedDayDetails?.date && new Date(selectedDayDetails.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </div>
                }
                placement="right"
                width={450}
                open={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                loading={detailsLoading}
              >
                {selectedDayDetails && (
                  <div>
                    {/* Summary */}
                    <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>TOTAL HOURS</Text>
                          <br />
                          <Text strong style={{ fontSize: 16 }}>
                            {selectedDayDetails.total_working_hours}
                          </Text>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>ENTRIES</Text>
                          <br />
                          <Text strong style={{ fontSize: 16 }}>
                            {selectedDayDetails.entry_count}
                          </Text>
                        </Col>
                      </Row>
                    </Card>

                    <Divider>
                      <Text strong>Clock In/Out Log</Text>
                    </Divider>

                    {/* Timeline of entries */}
                    <Timeline
                      items={selectedDayDetails.entries.map((entry: any, index: number) => {
                        try {
                          const location = entry.location ? JSON.parse(entry.location) : null;
                          return {
                            color: entry.clock_out ? 'green' : 'blue',
                            children: (
                              <div style={{ marginBottom: 16 }}>
                                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                                  {/* Clock In */}
                                  <Row align="middle" style={{ marginBottom: 8 }}>
                                    <Col span={4}>
                                      <span style={{ fontSize: 18 }}>✅</span>
                                    </Col>
                                    <Col span={10}>
                                      <Text strong>{entry.clock_in}</Text>
                                      <br />
                                      <Text type="secondary" style={{ fontSize: 11 }}>Clock In</Text>
                                    </Col>
                                    <Col span={10}>
                                      {location && (
                                        <a
                                          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ fontSize: 11 }}
                                        >
                                          📍 View Location
                                        </a>
                                      )}
                                    </Col>
                                  </Row>

                                  {/* Clock Out */}
                                  {entry.clock_out ? (
                                    <Row align="middle" style={{ marginBottom: 8 }}>
                                      <Col span={4}>
                                        <span style={{ fontSize: 18 }}>⏸️</span>
                                      </Col>
                                      <Col span={10}>
                                        <Text strong>{entry.clock_out}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 11 }}>Clock Out</Text>
                                      </Col>
                                      <Col span={10}>
                                        <Tag color="green">{entry.working_hours}</Tag>
                                      </Col>
                                    </Row>
                                  ) : (
                                    <Tag color="processing">Currently Active</Tag>
                                  )}

                                  {/* Notes */}
                                  {entry.notes && (
                                    <div style={{ marginTop: 8 }}>
                                      <Tag color={entry.notes.includes('Late') ? 'red' : 'default'}>
                                        {entry.notes}
                                      </Tag>
                                    </div>
                                  )}

                                  {/* Work Mode */}
                                  <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      Work Mode: <Tag color="blue">{entry.work_mode || 'Office'}</Tag>
                                    </Text>
                                  </div>
                                </Card>
                              </div>
                            )
                          };
                        } catch (error) {
                          return {
                            color: 'gray',
                            children: <Text>Error loading entry</Text>
                          };
                        }
                      })}
                    />

                    {/* Actions */}
                    <Divider />
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button block icon={<span>✏️</span>}>
                        Regularize
                      </Button>
                      <Button block icon={<span>📋</span>}>
                        Apply Partial Day
                      </Button>
                    </Space>
                  </div>
                )}
              </Drawer>
            </div>
          )}

          {selectedMenu === 'leave' && (
            <Card title="Leave Requests" bordered={false}>
              <Text>Leave management coming soon...</Text>
            </Card>
          )}

          {selectedMenu === 'payroll' && (
            <Card title="My Payroll" bordered={false}>
              <Text>Payroll information coming soon...</Text>
            </Card>
          )}

          {selectedMenu === 'documents' && (
            <Card title="My Documents" bordered={false}>
              <Text>Document management coming soon...</Text>
            </Card>
          )}

          {selectedMenu === 'profile' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}>
              <ProfilePage />
            </Suspense>
          )}

          {selectedMenu === 'settings' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}>
              <Settings />
            </Suspense>
          )}
        </Content>
      </Layout>

      {/* Clock In Modal */}
      <Modal
        title="Clock In"
        open={clockInModalVisible}
        onOk={handleClockInConfirm}
        onCancel={() => {
          setClockInModalVisible(false);
          setClockInNotes('');
        }}
        okText="Confirm Clock In"
        confirmLoading={loading}
        width={500}
      >
        <Space vertical style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>You are about to clock in</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </div>
          <div>
            <Text>Add notes (optional):</Text>
            <Input.TextArea
              rows={4}
              placeholder="Enter any notes about your work today..."
              value={clockInNotes}
              onChange={(e) => setClockInNotes(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ backgroundColor: '#f0f5ff', padding: 12, borderRadius: 6 }}>
            <Text style={{ fontSize: 12 }}>
              📍 Your location will be tracked for security purposes
            </Text>
          </div>
        </Space>
      </Modal>

      {/* Clock Out Modal */}
      <Modal
        title="Clock Out"
        open={clockOutModalVisible}
        onOk={handleClockOutConfirm}
        onCancel={() => {
          setClockOutModalVisible(false);
          setClockOutNotes('');
        }}
        okText="Confirm Clock Out"
        confirmLoading={loading}
        okButtonProps={{ danger: true }}
        width={500}
      >
        <Space vertical style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>You are about to clock out</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </div>
          {todayRecord && todayRecord.clock_in && (
            <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>CLOCK IN</Text>
                  <br />
                  <Text strong>{todayRecord.clock_in}</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>ELAPSED TIME</Text>
                  <br />
                  <Text strong style={{ color: '#52c41a' }}>
                    {(() => {
                      const hours = Math.floor(elapsedTime / 3600);
                      const minutes = Math.floor((elapsedTime % 3600) / 60);
                      const seconds = elapsedTime % 60;
                      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                    })()}
                  </Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>WILL BE</Text>
                  <br />
                  <Text strong>
                    {(() => {
                      const hours = Math.floor(elapsedTime / 3600);
                      const minutes = Math.floor((elapsedTime % 3600) / 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </Text>
                </Col>
              </Row>
            </Card>
          )}
          <div>
            <Text>Add notes (optional):</Text>
            <Input.TextArea
              rows={4}
              placeholder="Enter any notes about your work completion..."
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ backgroundColor: '#fff7e6', padding: 12, borderRadius: 6, border: '1px solid #ffd591' }}>
            <Text style={{ fontSize: 12 }}>
              ⏱️ Your timer will stop after confirmation
            </Text>
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default UserDashboard;
