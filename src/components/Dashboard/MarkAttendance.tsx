import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Timeline,
  message,
  Modal,
  Input,
  Select,
  Form,
  Alert,
  Divider,
  Typography,
  Spin,
  Empty
} from 'antd';
import {
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  HomeOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AttendanceRecord {
  id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  working_hours?: string;
  status: string;
  work_mode?: string;
  notes?: string;
  location?: string;
}

interface TodayAttendance {
  clockedIn: boolean;
  clockInTime?: string;
  clockOutTime?: string;
  workingHours?: string;
  status?: string;
  workMode?: string;
  notes?: string;
}

export default function MarkAttendance() {
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({
    clockedIn: false,
  });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTodayAttendance();
    fetchRecentAttendance();

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location',
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const today = dayjs().format('YYYY-MM-DD');

      const response = await fetch(`/api/attendance/my-attendance?date=${today}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const data = await response.json() as any;

      if (data.success && data.data.length > 0) {
        const record = data.data[0];
        setTodayAttendance({
          clockedIn: !!record.clock_in && !record.clock_out,
          clockInTime: record.clock_in,
          clockOutTime: record.clock_out,
          workingHours: record.working_hours,
          status: record.status,
          workMode: record.work_mode,
          notes: record.notes,
        });
      } else {
        setTodayAttendance({ clockedIn: false });
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const startDate = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');

      const response = await fetch(
        `/api/attendance/my-attendance?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const data = await response.json() as any;

      if (data.success) {
        setRecentAttendance(data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
    }
  };

  const handleClockIn = async (values: any) => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');

      const payload = {
        work_mode: values.work_mode,
        notes: values.notes || '',
        latitude: location?.lat,
        longitude: location?.lng,
        location_address: location?.address,
      };

      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Clocked in successfully!');
        setShowClockInModal(false);
        form.resetFields();
        await fetchTodayAttendance();
        await fetchRecentAttendance();
      } else {
        message.error(data.error || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      message.error('Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (values: any) => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');

      const payload = {
        notes: values.notes || '',
      };

      const response = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Clocked out successfully!');
        setShowClockOutModal(false);
        form.resetFields();
        await fetchTodayAttendance();
        await fetchRecentAttendance();
      } else {
        message.error(data.error || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      message.error('Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      present: 'success',
      late: 'warning',
      absent: 'error',
      'half-day': 'processing',
      'on-leave': 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      present: <CheckCircleOutlined />,
      late: <FieldTimeOutlined />,
      absent: <CloseCircleOutlined />,
    };
    return icons[status];
  };

  const calculateWorkingTime = () => {
    if (todayAttendance.clockInTime && !todayAttendance.clockOutTime) {
      const clockIn = dayjs(`${dayjs().format('YYYY-MM-DD')} ${todayAttendance.clockInTime}`);
      const diff = currentTime.diff(clockIn);
      const dur = dayjs.duration(diff);
      return `${Math.floor(dur.asHours())}h ${dur.minutes()}m`;
    }
    return todayAttendance.workingHours || '0h 0m';
  };

  const isLate = () => {
    if (todayAttendance.clockInTime) {
      const clockInHour = parseInt(todayAttendance.clockInTime.split(':')[0]);
      const clockInMinute = parseInt(todayAttendance.clockInTime.split(':')[1]);
      const clockInMinutes = clockInHour * 60 + clockInMinute;
      const expectedMinutes = 10 * 60 + 30; // 10:30 AM
      return clockInMinutes > expectedMinutes;
    }
    return false;
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Current Time */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small">
              <Text style={{ color: 'white', fontSize: '16px' }}>
                <ClockCircleOutlined /> {currentTime.format('dddd, MMMM D, YYYY')}
              </Text>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                {currentTime.format('HH:mm:ss')}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                Office Hours: 10:30 AM - 7:30 PM
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            {!todayAttendance.clockedIn && !todayAttendance.clockOutTime ? (
              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                onClick={() => setShowClockInModal(true)}
                style={{
                  height: '60px',
                  fontSize: '18px',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                }}
              >
                Clock In
              </Button>
            ) : todayAttendance.clockedIn && !todayAttendance.clockOutTime ? (
              <Button
                type="primary"
                size="large"
                danger
                icon={<LogoutOutlined />}
                onClick={() => setShowClockOutModal(true)}
                style={{ height: '60px', fontSize: '18px' }}
              >
                Clock Out
              </Button>
            ) : (
              <Tag color="success" style={{ fontSize: '16px', padding: '8px 16px' }}>
                <CheckCircleOutlined /> Attendance Marked
              </Tag>
            )}
          </Col>
        </Row>
      </Card>

      {/* Today's Attendance Status */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Clock In"
              value={todayAttendance.clockInTime || '--:--'}
              prefix={<LoginOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: todayAttendance.clockInTime ? '#52c41a' : '#999' }}
            />
            {isLate() && (
              <Tag color="warning" style={{ marginTop: '8px' }}>
                <FieldTimeOutlined /> Late Entry
              </Tag>
            )}
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Clock Out"
              value={todayAttendance.clockOutTime || '--:--'}
              prefix={<LogoutOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: todayAttendance.clockOutTime ? '#ff4d4f' : '#999' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Working Time"
              value={calculateWorkingTime()}
              prefix={<FieldTimeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Space direction="vertical" size="small">
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Work Mode
              </Text>
              <Space>
                {todayAttendance.workMode === 'office' ? (
                  <>
                    <BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <Text strong style={{ fontSize: '16px' }}>
                      Office
                    </Text>
                  </>
                ) : todayAttendance.workMode === 'wfh' ? (
                  <>
                    <HomeOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <Text strong style={{ fontSize: '16px' }}>
                      Work From Home
                    </Text>
                  </>
                ) : (
                  <Text type="secondary">Not Set</Text>
                )}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Location Info */}
      {location && (
        <Alert
          message="Location Detected"
          description={`Your location will be recorded with attendance. Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`}
          type="info"
          icon={<EnvironmentOutlined />}
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}

      {/* Recent Attendance Timeline */}
      <Card title="Recent Attendance History" style={{ marginTop: '24px' }}>
        {recentAttendance.length > 0 ? (
          <Timeline mode="left">
            {recentAttendance.map((record) => (
              <Timeline.Item
                key={record.id}
                dot={getStatusIcon(record.status)}
                color={getStatusColor(record.status) as any}
                label={
                  <Text strong>{dayjs(record.date).format('MMM DD, YYYY')}</Text>
                }
              >
                <Space direction="vertical" size="small">
                  <Space>
                    <Tag color={getStatusColor(record.status)}>
                      {record.status.toUpperCase()}
                    </Tag>
                    {record.work_mode && (
                      <Tag icon={record.work_mode === 'office' ? <BankOutlined /> : <HomeOutlined />}>
                        {record.work_mode === 'office' ? 'Office' : 'WFH'}
                      </Tag>
                    )}
                  </Space>
                  <Text>
                    In: {record.clock_in || 'N/A'} | Out: {record.clock_out || 'N/A'}
                  </Text>
                  {record.working_hours && (
                    <Text type="secondary">
                      <FieldTimeOutlined /> {record.working_hours}
                    </Text>
                  )}
                  {record.notes && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {record.notes}
                    </Text>
                  )}
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty description="No recent attendance records" />
        )}
      </Card>

      {/* Clock In Modal */}
      <Modal
        title={
          <Space>
            <LoginOutlined style={{ color: '#52c41a' }} />
            <span>Clock In</span>
          </Space>
        }
        open={showClockInModal}
        onCancel={() => {
          setShowClockInModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Divider />
        <Alert
          message={`Current Time: ${currentTime.format('HH:mm:ss')}`}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form form={form} layout="vertical" onFinish={handleClockIn}>
          <Form.Item
            name="work_mode"
            label="Work Mode"
            rules={[{ required: true, message: 'Please select work mode' }]}
            initialValue="office"
          >
            <Select size="large">
              <Select.Option value="office">
                <Space>
                  <BankOutlined />
                  Office
                </Space>
              </Select.Option>
              <Select.Option value="wfh">
                <Space>
                  <HomeOutlined />
                  Work From Home
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes (Optional)">
            <TextArea
              rows={3}
              placeholder="Add any notes about your work day..."
              maxLength={200}
              showCount
            />
          </Form.Item>

          {location && (
            <Alert
              message="Location will be recorded"
              description={`Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`}
              type="info"
              icon={<EnvironmentOutlined />}
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowClockInModal(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading} icon={<LoginOutlined />}>
                Clock In Now
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Clock Out Modal */}
      <Modal
        title={
          <Space>
            <LogoutOutlined style={{ color: '#ff4d4f' }} />
            <span>Clock Out</span>
          </Space>
        }
        open={showClockOutModal}
        onCancel={() => {
          setShowClockOutModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Divider />
        <Alert
          message={`Current Time: ${currentTime.format('HH:mm:ss')}`}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Alert
          message={`Working Time: ${calculateWorkingTime()}`}
          type="success"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form form={form} layout="vertical" onFinish={handleClockOut}>
          <Form.Item name="notes" label="End of Day Notes (Optional)">
            <TextArea
              rows={4}
              placeholder="Summary of today's work, achievements, or any notes..."
              maxLength={300}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowClockOutModal(false)}>Cancel</Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={loading}
                icon={<LogoutOutlined />}
              >
                Clock Out Now
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
