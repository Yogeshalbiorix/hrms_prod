import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, DatePicker, Select, Statistic, Row, Col, Badge, Tooltip, message } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AttendanceSession {
  id: number;
  clock_in: string;
  clock_out: string | null;
  working_hours: string | null;
  notes: string | null;
  location: string | null;
  status: string;
}

interface AttendanceRecord {
  employee_id: number;
  date: string;
  first_name: string;
  last_name: string;
  emp_code: string;
  position: string;
  username: string;
  email: string;
  sessions: AttendanceSession[];
  total_minutes: number;
  total_working_hours: string;
  session_count: number;
  first_clock_in: string;
  last_clock_out: string | null;
  has_active_session: boolean;
  notes?: string;
  status?: string;
}

interface AttendanceStats {
  total_employees: number;
  total_records: number;
  present_count: number;
  absent_count: number;
  late_count: number;
}

export default function AdminAttendanceView() {
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [activeSessionsData, setActiveSessionsData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDays]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/attendance/all-attendance?days=${selectedDays}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: { records: AttendanceRecord[]; active_sessions: AttendanceRecord[]; statistics: AttendanceStats }; error?: string };

      if (result.success && result.data) {
        setAttendanceData(result.data.records || []);
        setActiveSessionsData(result.data.active_sessions || []);
        setStats(result.data.statistics || { total_hours: 0, total_employees: 0, present_today: 0, average_hours: 0 });
      } else {
        message.error(result.error || 'Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      message.error('Failed to load attendance data');
    }
    setLoading(false);
  };

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => {
        const d = new Date(date);
        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {d.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        );
      },
      sorter: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    },
    {
      title: 'Employee',
      key: 'employee',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.first_name} {record.last_name}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.emp_code} • {record.position}
          </div>
        </div>
      ),
      sorter: (a, b) => a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Clock In',
      dataIndex: 'clock_in',
      key: 'clock_in',
      width: 100,
      render: (time: string) => (
        <Tag icon={<ClockCircleOutlined />} color="blue">
          {time || '-'}
        </Tag>
      ),
    },
    {
      title: 'Clock Out',
      dataIndex: 'clock_out',
      key: 'clock_out',
      width: 100,
      render: (time: string | null) =>
        time ? (
          <Tag icon={<ClockCircleOutlined />} color="orange">
            {time}
          </Tag>
        ) : (
          <Tag color="processing">Active</Tag>
        ),
    },
    {
      title: 'Working Hours',
      dataIndex: 'working_hours',
      key: 'working_hours',
      width: 120,
      render: (hours: string | null) => hours || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record) => {
        const isLate = record.notes?.includes('Late');
        let color = 'green';
        let icon = <CheckCircleOutlined />;

        if (status === 'absent') {
          color = 'red';
          icon = <CloseCircleOutlined />;
        } else if (isLate) {
          color = 'orange';
          icon = <WarningOutlined />;
        }

        return (
          <Tag icon={icon} color={color}>
            {isLate ? 'LATE' : status.toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: 'Present', value: 'present' },
        { text: 'Absent', value: 'absent' },
        { text: 'Late', value: 'late' },
      ],
      onFilter: (value, record) => {
        if (value === 'late') return record.notes?.includes('Late') || false;
        return record.status === value;
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (notes: string | null) => notes || '-',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: string | null) => {
        if (!location) return <Tag>No Location</Tag>;
        try {
          const loc = JSON.parse(location);
          return (
            <Tooltip title={loc.address}>
              <a
                href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <EnvironmentOutlined /> View Map
              </a>
            </Tooltip>
          );
        } catch {
          return <Tag>Invalid</Tag>;
        }
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats?.total_records || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Present Today"
              value={stats?.present_count || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Late Arrivals"
              value={stats?.late_count || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Now"
              value={activeSessionsData?.length || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Active Sessions */}
      {activeSessionsData && activeSessionsData.length > 0 && (
        <Card
          title={
            <Space>
              <Badge status="processing" />
              <span>Active Sessions ({activeSessionsData.length})</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Space vertical style={{ width: '100%' }}>
            {activeSessionsData.map((session) => (
              <Card key={session.employee_id} size="small" style={{ backgroundColor: '#f0f5ff' }}>
                <Row align="middle">
                  <Col flex="auto">
                    <Space>
                      <UserOutlined />
                      <span style={{ fontWeight: 'bold' }}>
                        {session.first_name} {session.last_name}
                      </span>
                      <Tag>{session.emp_code}</Tag>
                      <span style={{ color: '#666' }}>•</span>
                      <span>Clocked in at {session.first_clock_in}</span>
                    </Space>
                  </Col>
                  <Col>
                    <Badge status="processing" text="Currently Working" />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* Main Attendance Table */}
      <Card
        title="Attendance Records"
        extra={
          <Space>
            <Select
              value={selectedDays}
              onChange={setSelectedDays}
              style={{ width: 120 }}
            >
              <Option value={7}>Last 7 Days</Option>
              <Option value={15}>Last 15 Days</Option>
              <Option value={30}>Last 30 Days</Option>
              <Option value={60}>Last 60 Days</Option>
              <Option value={90}>Last 90 Days</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAttendanceData}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={attendanceData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
