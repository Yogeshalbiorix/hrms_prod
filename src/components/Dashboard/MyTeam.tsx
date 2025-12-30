import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Space,
  Tag,
  Spin,
  Button,
  Tooltip,
  Divider,
  Badge,
  message
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  LaptopOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Interfaces
interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  department_name?: string;
  profile_image?: string;
  status: string;
}

interface CalendarStatus {
  status: string; // 'present', 'leave', 'weekend', 'empty', 'holiday'
  label?: string;
  type?: string; // for leave type
  check_in?: string; // for present
  check_out?: string;
  detail?: string; // 'late', 'half-day'
  work_mode?: string;
}

interface TeamData {
  employees: Employee[];
  calendar: Record<number, Record<string, CalendarStatus>>;
}

export default function MyTeam() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [teamData, setTeamData] = useState<TeamData>({ employees: [], calendar: {} });
  const [todayStats, setTodayStats] = useState({
    off: [] as Employee[],
    notIn: [] as Employee[],
    onTime: 0,
    late: 0,
    wfh: 0,
    remote: 0
  });

  useEffect(() => {
    fetchTeamData();
  }, [currentDate]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');
      const year = currentDate.year();
      const month = currentDate.month() + 1;

      // Get current user to filter by manager if needed
      const profileRes = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      const profileData = await profileRes.json() as any;
      const user = profileData.user || profileData.data; // Handle different response structures if any

      // If user is Admin, they might want to see specific teams or all. 
      // For now, if Admin, we won't filter by direct reports (i.e. sending manager_id) 
      // unless we want to simulate a manager view. 
      // Actually, let's keep it simple: If employee_id is null/undefined, it's likely super account.
      // But typically, we should start with "All Employees" for Admin, or "My Team" (Direct Reports) for Manager.
      // Let's assume for "My Team", even Admins want to see *their* team, but if they have none, maybe show All?

      let managerId = user?.id; // By default, filter by current user as manager

      // If Admin and no specific team assigned (or just to be helpful in dev), 
      // let's fetch ALL if we want (by passing nothing or specific flag).
      // However, "My Team" usually implies direct reports. 
      // If the user wants to see "Admin Panel" style (everyone), they usually go to Employee Directory.
      // But to ensure the user sees Data:
      if (user?.role === 'admin') {
        // If admin has no direct reports, maybe show everyone?
        // Let's try to query without manager_id for admins to ensure they see data.
        managerId = undefined;
      }

      const response = await fetch(`/api/team/calendar-status?year=${year}&month=${month}${managerId ? `&manager_id=${managerId}` : ''}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const data = await response.json() as any;

      if (data.success) {
        setTeamData(data.data);
        calculateTodayStats(data.data.employees, data.data.calendar);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      message.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayStats = (employees: Employee[], calendar: Record<number, Record<string, CalendarStatus>>) => {
    const today = dayjs().format('YYYY-MM-DD');
    const stats = {
      off: [] as Employee[],
      notIn: [] as Employee[],
      onTime: 0,
      late: 0,
      wfh: 0,
      remote: 0
    };

    employees.forEach(emp => {
      const statusOD = calendar[emp.id]?.[today];

      if (!statusOD) {
        // Assume not in yet if no record and not weekend
        if (dayjs().day() !== 0 && dayjs().day() !== 6) {
          stats.notIn.push(emp);
        }
        return;
      }

      if (statusOD.status === 'leave') {
        stats.off.push(emp);
      } else if (statusOD.status === 'present') {
        if (statusOD.detail === 'late') {
          stats.late++;
        } else {
          stats.onTime++;
        }

        if (statusOD.work_mode === 'wfh' || statusOD.work_mode === 'remote') {
          stats.wfh++;
          if (statusOD.work_mode === 'remote') stats.remote++;
        } else {
          // If no work_mode, keep mock for demo purposes if needed, 
          // but let's stick to data if we want to be real. 
          // Currently data might be empty for work_mode so stats might be 0.
        }
      } else if (statusOD.status === 'empty' && dayjs().day() !== 0 && dayjs().day() !== 6) {
        // If status is empty and it's a weekday, they are not in yet
        stats.notIn.push(emp);
      }
    });

    setTodayStats(stats);
  };

  const daysInMonth = currentDate.daysInMonth();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatusColor = (status?: CalendarStatus) => {
    if (!status) return '#f0f0f0'; // default gray
    if (status.status === 'weekend') return '#fff'; // Weekend usually blank or light
    if (status.status === 'leave') {
      if (status.type === 'sick') return '#ff4d4f'; // Red for Sick
      return '#1890ff'; // Blue for Paid Leave
    }
    if (status.status === 'present') {
      if (status.detail === 'late') return '#faad14'; // Orange/Yellow for Late
      if (status.detail === 'half-day') return '#722ed1'; // Purple for Half Day
      return '#52c41a'; // Green for On Time/Present
    }
    if (status.status === 'holiday') return '#52c41a'; // Green for holiday? Or maybe specific color
    return '#f5f5f5';
  };

  const getStatusInitial = (status?: CalendarStatus) => {
    if (!status) return '-';
    if (status.status === 'weekend') return 'W';
    if (status.status === 'leave') return 'L';
    if (status.status === 'present') return 'P';
    return '-';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>

      {/* Summary Section */}
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row gutter={[24, 24]}>
          {/* Who is off today */}
          <Col xs={24} md={12}>
            <Title level={5} style={{ marginBottom: 16 }}>Who is off today</Title>
            {todayStats.off.length > 0 ? (
              <Space wrap>
                {todayStats.off.map(emp => (
                  <Tooltip title={`${emp.first_name} ${emp.last_name}`} key={emp.id}>
                    <Avatar src={emp.profile_image} style={{ backgroundColor: '#1890ff' }}>{emp.first_name[0]}</Avatar>
                  </Tooltip>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No one is off today</Text>
            )}
          </Col>

          {/* Not in yet today */}
          <Col xs={24} md={12}>
            <Title level={5} style={{ marginBottom: 16 }}>Not in yet today</Title>
            {todayStats.notIn.length > 0 ? (
              <Space wrap>
                {todayStats.notIn.map(emp => (
                  <Tooltip title={`${emp.first_name} ${emp.last_name}`} key={emp.id}>
                    <Avatar src={emp.profile_image} style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{emp.first_name[0]}</Avatar>
                  </Tooltip>
                ))}
              </Space>
            ) : (
              <Text type="secondary">Everyone has checked in</Text>
            )}
          </Col>
        </Row>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ borderLeft: '3px solid #52c41a', paddingLeft: 16 }}>
              <Text type="secondary">Employees On Time today</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{todayStats.onTime}</div>
              <Button type="link" style={{ padding: 0 }}>View Employees</Button>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ borderLeft: '3px solid #cf1322', paddingLeft: 16 }}>
              <Text type="secondary">Late Arrivals today</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{todayStats.late}</div>
              <Button type="link" style={{ padding: 0 }}>View Employees</Button>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ borderLeft: '3px solid #1890ff', paddingLeft: 16 }}>
              <Text type="secondary">Work from Home / On Duty today</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{todayStats.wfh}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ borderLeft: '3px solid #faad14', paddingLeft: 16 }}>
              <Text type="secondary">Remote Clock-ins today</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{todayStats.remote}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Team Calendar Section */}
      <Card
        title="Team calendar"
        bordered={false}
        style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        extra={
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))} />
            <span style={{ fontWeight: 500 }}>{currentDate.format('MMMM YYYY')}</span>
            <Button icon={<RightOutlined />} onClick={() => setCurrentDate(currentDate.add(1, 'month'))} />
          </Space>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', minWidth: 200, paddingBottom: 16 }}>Employee</th>
                  {daysArray.map(day => {
                    const date = currentDate.date(day);
                    const isWeekEnd = date.day() === 0 || date.day() === 6;
                    return (
                      <th key={day} style={{ width: 30, textAlign: 'center', fontSize: 12, color: isWeekEnd ? '#999' : '#333' }}>
                        <div style={{ marginBottom: 4 }}>{date.format('dd')}</div>
                        <div>{day}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {teamData.employees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ padding: '8px 0' }}>
                      <Space>
                        <Avatar src={emp.profile_image} style={{ backgroundColor: '#1890ff' }}>{emp.first_name[0]}</Avatar>
                        <Text>{emp.first_name} {emp.last_name}</Text>
                      </Space>
                    </td>
                    {daysArray.map(day => {
                      const dateStr = currentDate.date(day).format('YYYY-MM-DD');
                      const status = teamData.calendar[emp.id]?.[dateStr];
                      const color = getStatusColor(status);

                      // Custom rendering for circles/pills
                      if (status?.status === 'weekend') {
                        return <td key={day} style={{ textAlign: 'center' }}></td>;
                      }

                      return (
                        <td key={day} style={{ textAlign: 'center' }}>
                          {status?.status && status.status !== 'empty' && (
                            <Tooltip title={`${status.label || status.status} ${status.check_in ? `(${status.check_in})` : ''}`}>
                              <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: color,
                                margin: '0 auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 10,
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}>
                                {/* We can put initial or icon here if needed, or just color */}
                                {status.detail === 'half-day' && 'H'}
                              </div>
                            </Tooltip>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Present', color: '#52c41a' },
            { label: 'Absent', color: '#ff4d4f' },
            { label: 'Half Day', color: '#722ed1' },
            { label: 'Late', color: '#faad14' },
            { label: 'Paid Leave', color: '#1890ff' },
            { label: 'Unpaid Leave', color: '#595959' },
            { label: 'Holiday', color: '#13c2c2' },
            { label: 'Weekly Off', color: '#d9d9d9' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }} />
              <Text style={{ fontSize: 12 }}>{item.label}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Peers Section */}
      <Card title={`Peers (${teamData.employees.length})`} bordered={false} style={{ borderRadius: 8 }}>
        <Row gutter={[16, 16]}>
          {teamData.employees.map(emp => {
            const isActive = todayStats.notIn.find(e => e.id === emp.id) === undefined;
            return (
              <Col key={emp.id} xs={24} sm={12} md={8} lg={6}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                  <Space>
                    <Avatar size="large" src={emp.profile_image} style={{ backgroundColor: '#1890ff' }}>{emp.first_name[0]}</Avatar>
                    <div>
                      <div style={{ fontWeight: 500 }}>{emp.first_name} {emp.last_name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{emp.position}</Text>
                      {isActive && (
                        <div style={{ fontSize: 11, marginTop: 4, color: '#666' }}>
                          {(() => {
                            const today = dayjs().format('YYYY-MM-DD');
                            const status = teamData.calendar[emp.id]?.[today];
                            if (status?.check_in) {
                              return (
                                <Space split={<Divider type="vertical" />}>
                                  <span>In: {status.check_in.substring(0, 5)}</span>
                                  {status.check_out && <span>Out: {status.check_out.substring(0, 5)}</span>}
                                </Space>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </Space>
                  <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'IN' : 'OUT'}</Tag>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
}
