import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Space,
  Tag,
  Empty,
  Spin,
  Descriptions,
  Divider,
  Button,
  Statistic,
  Timeline,
  message
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  BankOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface TeamMember {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department_name?: string;
  hire_date: string;
  profile_image?: string;
  city?: string;
  status: string;
}

interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  department_name?: string;
  profile_image?: string;
}

export default function MyTeam() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTeamMembers();
      fetchTeamAttendance();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json() as any;

      if (data.success) {
        setCurrentUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/employees', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json() as any;

      if (data.success) {
        // Filter employees who report to current user and exclude terminated employees
        const myTeam = data.data.filter((emp: any) =>
          emp.manager_id === currentUser?.id && emp.status !== 'terminated'
        );
        setTeamMembers(myTeam);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      message.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamAttendance = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const today = dayjs().format('YYYY-MM-DD');

      const response = await fetch(`/api/attendance?date=${today}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json() as any;

      if (data.success) {
        const attendanceMap: Record<number, any> = {};
        data.data.forEach((record: any) => {
          attendanceMap[record.employee_id] = record;
        });
        setTodayAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching team attendance:', error);
    }
  };

  const getActivityStatus = (employeeId: number): 'active' | 'inactive' => {
    const attendance = todayAttendance[employeeId];
    if (!attendance) return 'inactive';

    if (attendance.check_in_time && !attendance.check_out_time) {
      return 'active';
    }

    return 'inactive';
  };

  const getTeamStats = () => {
    const active = teamMembers.filter(member => getActivityStatus(member.id) === 'active').length;
    const present = Object.values(todayAttendance).filter((att: any) =>
      teamMembers.some(m => m.id === att.employee_id) && att.check_in_time
    ).length;

    return {
      total: teamMembers.length,
      active,
      present,
      absent: teamMembers.length - present,
    };
  };

  const stats = getTeamStats();

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>
            <TeamOutlined /> My Team
          </Title>
          <Text type="secondary">View and manage your direct reports</Text>
        </Col>
      </Row>

      {/* Current User Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={24}>
          <Col>
            <Avatar
              size={80}
              src={currentUser.profile_image}
              style={{ backgroundColor: '#1890ff' }}
            >
              {currentUser.first_name.charAt(0)}{currentUser.last_name.charAt(0)}
            </Avatar>
          </Col>
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>
              {currentUser.first_name} {currentUser.last_name}
            </Title>
            <Text type="secondary">{currentUser.position}</Text>
            <br />
            <Tag color="blue">{currentUser.department_name}</Tag>
          </Col>
          <Col>
            <Statistic
              title="Direct Reports"
              value={teamMembers.length}
              prefix={<TeamOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Team Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Team Members"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Now"
              value={stats.active}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Present Today"
              value={stats.present}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Absent Today"
              value={stats.absent}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Team Members Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : teamMembers.length === 0 ? (
        <Card>
          <Empty
            description="No team members assigned"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              You don't have any direct reports assigned yet.
            </Text>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {teamMembers.map((member) => (
            <Col xs={24} sm={12} md={8} lg={6} key={member.id}>
              <Card
                hoverable
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {/* Avatar with Status */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar
                        size={80}
                        src={member.profile_image}
                        style={{
                          backgroundColor: '#1890ff',
                          fontSize: '28px',
                        }}
                      >
                        {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                      </Avatar>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: getActivityStatus(member.id) === 'active' ? '#52c41a' : '#d9d9d9',
                          border: '2px solid white',
                        }}
                      />
                    </div>
                  </div>

                  {/* Name & Position */}
                  <div style={{ textAlign: 'center' }}>
                    <Title level={5} style={{ margin: '8px 0 4px' }}>
                      {member.first_name} {member.last_name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {member.position}
                    </Text>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  {/* Details */}
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text style={{ fontSize: '12px' }}>
                      <IdcardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      ID: <strong>{member.employee_id}</strong>
                    </Text>
                    <Text style={{ fontSize: '12px' }}>
                      <BankOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      {member.department_name || 'N/A'}
                    </Text>
                    <Text style={{ fontSize: '12px' }} ellipsis>
                      <MailOutlined style={{ marginRight: 8, color: '#faad14' }} />
                      {member.email}
                    </Text>
                    {member.phone && (
                      <Text style={{ fontSize: '12px' }}>
                        <PhoneOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                        {member.phone}
                      </Text>
                    )}
                    {member.city && (
                      <Text style={{ fontSize: '12px' }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#13c2c2' }} />
                        {member.city}
                      </Text>
                    )}
                  </Space>

                  {/* Status Tags */}
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <Space>
                      <Tag color={member.status === 'active' ? 'success' : 'default'}>
                        {member.status.toUpperCase()}
                      </Tag>
                      <Tag
                        icon={getActivityStatus(member.id) === 'active' ? <ClockCircleOutlined /> : <CloseCircleOutlined />}
                        color={getActivityStatus(member.id) === 'active' ? 'success' : 'default'}
                      >
                        {getActivityStatus(member.id) === 'active' ? 'ACTIVE' : 'OFFLINE'}
                      </Tag>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
