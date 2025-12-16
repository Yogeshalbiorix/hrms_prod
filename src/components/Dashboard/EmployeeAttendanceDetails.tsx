import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Space,
  Typography,
  Avatar,
  Descriptions,
  Row,
  Col,
  Statistic,
  Button,
  DatePicker,
  Spin,
  Empty,
  Timeline,
  Badge,
  Divider
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  FieldTimeOutlined,
  LeftOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  HomeOutlined,
  IdcardOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface EmployeeAttendanceDetailsProps {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  onBack: () => void;
}

export default function EmployeeAttendanceDetails({
  employeeId,
  employeeName,
  employeeCode,
  position,
  department,
  email,
  phone,
  onBack
}: EmployeeAttendanceDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId, dateRange]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // Fetch attendance records
      const attendanceResponse = await fetch(
        `/api/attendance?employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
      const attendanceResult = await attendanceResponse.json() as any;

      if (attendanceResult.success) {
        setAttendanceData(attendanceResult.data);

        // Calculate stats
        const present = attendanceResult.data.filter((r: any) => r.status === 'present').length;
        const late = attendanceResult.data.filter((r: any) => r.status === 'late' || r.notes?.includes('Late')).length;
        const absent = attendanceResult.data.filter((r: any) => r.status === 'absent').length;
        const halfDay = attendanceResult.data.filter((r: any) => r.status === 'half-day').length;

        setStats({
          total: attendanceResult.data.length,
          present,
          late,
          absent,
          halfDay
        });
      }

      // Fetch leave records
      const leaveResponse = await fetch(
        `/api/leaves?employee_id=${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
      const leaveResult = await leaveResponse.json() as any;

      if (leaveResult.success) {
        setLeaveData(leaveResult.data);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceColumns = [
    {
      title: 'Date',
      dataIndex: 'attendance_date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: any, b: any) => dayjs(a.attendance_date).unix() - dayjs(b.attendance_date).unix(),
    },
    {
      title: 'Check In',
      dataIndex: 'check_in_time',
      key: 'check_in',
      render: (time: string) => time ? (
        <Tag color="blue" icon={<ClockCircleOutlined />}>{time}</Tag>
      ) : '-',
    },
    {
      title: 'Check Out',
      dataIndex: 'check_out_time',
      key: 'check_out',
      render: (time: string) => time ? (
        <Tag color="orange" icon={<ClockCircleOutlined />}>{time}</Tag>
      ) : <Tag color="processing">Active</Tag>,
    },
    {
      title: 'Working Hours',
      dataIndex: 'working_hours',
      key: 'working_hours',
      render: (hours: string) => hours ? (
        <Tag color="cyan">{hours}</Tag>
      ) : '-',
    },
    {
      title: 'Work Mode',
      dataIndex: 'work_mode',
      key: 'work_mode',
      render: (mode: string) => {
        if (mode === 'office') return <Tag color="blue" icon={<BankOutlined />}>Office</Tag>;
        if (mode === 'wfh') return <Tag color="green" icon={<HomeOutlined />}>WFH</Tag>;
        return '-';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: any = {
          present: { color: 'success', icon: <CheckCircleOutlined /> },
          late: { color: 'warning', icon: <WarningOutlined /> },
          absent: { color: 'error', icon: <CloseCircleOutlined /> },
          'half-day': { color: 'processing', icon: <ClockCircleOutlined /> },
        };
        const { color, icon } = config[status] || config.present;
        return <Tag color={color} icon={icon}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  const leaveColumns = [
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type: string) => {
        const colors: any = {
          sick: 'red',
          vacation: 'blue',
          personal: 'purple',
          maternity: 'pink',
          paternity: 'cyan',
          unpaid: 'default'
        };
        return <Tag color={colors[type] || 'blue'}>{type?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Total Days',
      dataIndex: 'total_days',
      key: 'total_days',
      render: (days: number) => <Tag>{days} {days === 1 ? 'day' : 'days'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: any = {
          pending: 'warning',
          approved: 'success',
          rejected: 'error',
          cancelled: 'default'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => reason || '-',
    },
  ];

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Back Button & Header */}
      <Button
        icon={<LeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 16 }}
      >
        Back to Organization
      </Button>

      {/* Employee Info Card */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row align="middle" gutter={24}>
          <Col>
            <Badge dot status="success" offset={[-10, 10]}>
              <Avatar
                size={80}
                style={{ backgroundColor: '#fff', color: '#667eea', fontSize: '28px' }}
              >
                {getInitials(employeeName)}
              </Avatar>
            </Badge>
          </Col>
          <Col flex={1}>
            <Space direction="vertical" size="small">
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {employeeName}
              </Title>
              <Space size="large">
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <IdcardOutlined /> {employeeCode}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <BankOutlined /> {position}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <TeamOutlined /> {department}
                </Text>
              </Space>
              <Space size="large">
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <MailOutlined /> {email}
                </Text>
                {phone && (
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <PhoneOutlined /> {phone}
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Records"
                value={stats.total}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Present"
                value={stats.present}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Late"
                value={stats.late}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Absent"
                value={stats.absent}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Date Range Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Text strong>Date Range:</Text>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!, dates[1]!]);
              }
            }}
            format="YYYY-MM-DD"
          />
        </Space>
      </Card>

      {/* Tabs for Attendance & Leave */}
      <Card>
        <Tabs
          defaultActiveKey="attendance"
          items={[
            {
              key: 'attendance',
              label: (
                <span>
                  <ClockCircleOutlined />
                  Attendance Records ({attendanceData.length})
                </span>
              ),
              children: loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Table
                  columns={attendanceColumns}
                  dataSource={attendanceData}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Total ${total} records`,
                  }}
                  locale={{
                    emptyText: <Empty description="No attendance records found" />
                  }}
                />
              ),
            },
            {
              key: 'leave',
              label: (
                <span>
                  <FileTextOutlined />
                  Leave History ({leaveData.length})
                </span>
              ),
              children: loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Table
                  columns={leaveColumns}
                  dataSource={leaveData}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Total ${total} records`,
                  }}
                  locale={{
                    emptyText: <Empty description="No leave records found" />
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
