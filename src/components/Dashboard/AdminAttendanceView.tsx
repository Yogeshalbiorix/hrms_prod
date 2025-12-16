import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, DatePicker, Select, Statistic, Row, Col, Badge, Tooltip, message, Modal, Descriptions, Timeline, Tabs } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

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

interface LeaveRequest {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  approved_by: string | null;
  created_at: string;
}

interface EmployeeDetails {
  employee_id: number;
  first_name: string;
  last_name: string;
  emp_code: string;
  email: string;
  position: string;
  department: string;
  attendance_records: AttendanceRecord[];
  leave_requests: LeaveRequest[];
  total_attendance_days: number;
  total_working_hours: string;
  average_hours_per_day: string;
  late_count: number;
  absent_count: number;
}

export default function AdminAttendanceView() {
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [activeSessionsData, setActiveSessionsData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const fetchEmployeeDetails = async (employeeId: number) => {
    setLoadingDetails(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/attendance/employee/${employeeId}?days=${selectedDays}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: EmployeeDetails; error?: string };

      if (result.success && result.data) {
        setSelectedEmployee(result.data);
        setShowEmployeeDetail(true);
      } else {
        message.error(result.error || 'Failed to fetch employee details');
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      message.error('Failed to load employee details');
    }
    setLoadingDetails(false);
  };

  const getLeaveStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'orange',
      'approved': 'green',
      'rejected': 'red',
      'cancelled': 'default'
    };
    return colors[status] || 'default';
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'sick': 'red',
      'vacation': 'blue',
      'personal': 'purple',
      'maternity': 'pink',
      'paternity': 'cyan',
      'unpaid': 'default'
    };
    return colors[type] || 'default';
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
      title: 'First Clock In',
      dataIndex: 'first_clock_in',
      key: 'first_clock_in',
      width: 120,
      render: (time: string) => (
        <Tag icon={<ClockCircleOutlined />} color="blue">
          {time || '-'}
        </Tag>
      ),
    },
    {
      title: 'Last Clock Out',
      dataIndex: 'last_clock_out',
      key: 'last_clock_out',
      width: 120,
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
      title: 'Total Hours',
      dataIndex: 'total_working_hours',
      key: 'total_working_hours',
      width: 120,
      render: (hours: string) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {hours || '-'}
        </span>
      ),
    },
    {
      title: 'Sessions',
      dataIndex: 'session_count',
      key: 'session_count',
      width: 80,
      align: 'center' as const,
      render: (count: number) => (
        <Tag color="purple">{count}</Tag>
      ),
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
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => fetchEmployeeDetails(record.employee_id)}
          loading={loadingDetails}
        >
          View Details
        </Button>
      ),
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
            <Tooltip title="Seed sample data for testing">
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test/seed-attendance', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
                      }
                    });
                    const result = await response.json() as { success: boolean; error?: string };
                    if (result.success) {
                      message.success('Sample data created successfully!');
                      fetchAttendanceData();
                    } else {
                      message.error(result.error || 'Failed to seed data');
                    }
                  } catch (err) {
                    message.error('Error seeding data');
                  }
                }}
              >
                Seed Test Data
              </Button>
            </Tooltip>
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
        {attendanceData.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <ClockCircleOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <h3 style={{ color: '#595959' }}>No Attendance Records Found</h3>
            <p style={{ color: '#8c8c8c', marginBottom: 24 }}>
              There are no attendance records for the selected period.
              {stats?.total_employees === 0 && ' Make sure employees have been added and are clocking in.'}
            </p>
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const response = await fetch('/api/test/seed-attendance', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
                    }
                  });
                  const result = await response.json() as { success: boolean; error?: string };
                  if (result.success) {
                    message.success('Sample data created successfully!');
                    fetchAttendanceData();
                  } else {
                    message.error(result.error || 'Failed to seed data');
                  }
                } catch (err) {
                  message.error('Error seeding data');
                }
              }}
            >
              Generate Sample Data
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={attendanceData}
            rowKey={(record) => `${record.employee_id}-${record.date}`}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} records`,
            }}
            scroll={{ x: 1200 }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ margin: 0, padding: 16, backgroundColor: '#fafafa' }}>
                  <h4 style={{ marginBottom: 12, color: '#1890ff' }}>Session Details ({record.session_count} sessions)</h4>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {record.sessions.map((session, index) => (
                      <Card key={session.id} size="small" style={{ backgroundColor: '#fff' }}>
                        <Row gutter={16} align="middle">
                          <Col span={2}>
                            <Tag color="blue">#{index + 1}</Tag>
                          </Col>
                          <Col span={4}>
                            <div style={{ fontSize: 12, color: '#666' }}>Clock In</div>
                            <Tag icon={<ClockCircleOutlined />} color="blue">{session.clock_in}</Tag>
                          </Col>
                          <Col span={4}>
                            <div style={{ fontSize: 12, color: '#666' }}>Clock Out</div>
                            {session.clock_out ? (
                              <Tag icon={<ClockCircleOutlined />} color="orange">{session.clock_out}</Tag>
                            ) : (
                              <Tag color="processing">Active</Tag>
                            )}
                          </Col>
                          <Col span={4}>
                            <div style={{ fontSize: 12, color: '#666' }}>Duration</div>
                            <span style={{ fontWeight: 'bold' }}>{session.working_hours || 'In Progress'}</span>
                          </Col>
                          <Col span={4}>
                            <div style={{ fontSize: 12, color: '#666' }}>Status</div>
                            <Tag color={session.status === 'present' ? 'green' : 'default'}>
                              {session.status}
                            </Tag>
                          </Col>
                          <Col span={6}>
                            <div style={{ fontSize: 12, color: '#666' }}>Notes</div>
                            <span style={{ fontSize: 12 }}>{session.notes || '-'}</span>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Space>
                </div>
              ),
              rowExpandable: (record) => record.sessions && record.sessions.length > 0,
            }}
          />
        )}
      </Card>

      {/* Employee Details Modal */}
      <Modal
        title={
          selectedEmployee ? (
            <Space>
              <UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
              <span style={{ fontSize: '18px', fontWeight: 600 }}>
                {selectedEmployee.first_name} {selectedEmployee.last_name} - Attendance & Leave Details
              </span>
            </Space>
          ) : 'Employee Details'
        }
        open={showEmployeeDetail}
        onCancel={() => {
          setShowEmployeeDetail(false);
          setSelectedEmployee(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowEmployeeDetail(false);
            setSelectedEmployee(null);
          }}>
            Close
          </Button>
        ]}
        width={1000}
      >
        {selectedEmployee && (
          <div>
            {/* Employee Summary */}
            <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} labelStyle={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }} contentStyle={{ color: 'white', fontWeight: 500 }}>
                    <Descriptions.Item label="Employee Code">{selectedEmployee.emp_code}</Descriptions.Item>
                    <Descriptions.Item label="Position">{selectedEmployee.position}</Descriptions.Item>
                    <Descriptions.Item label="Department">{selectedEmployee.department}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedEmployee.email}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Days Present</span>}
                      value={selectedEmployee.total_attendance_days}
                      valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                    />
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Working Hours</span>}
                      value={selectedEmployee.total_working_hours}
                      valueStyle={{ color: 'white', fontSize: '24px' }}
                    />
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Quick Stats */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Average Hours/Day"
                    value={selectedEmployee.average_hours_per_day}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Late Arrivals"
                    value={selectedEmployee.late_count}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Leave Requests"
                    value={selectedEmployee.leave_requests?.length || 0}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Tabs for Attendance and Leave */}
            <Tabs
              defaultActiveKey="attendance"
              items={[
                {
                  key: 'attendance',
                  label: (
                    <span>
                      <HistoryOutlined />
                      Attendance History ({selectedEmployee.attendance_records?.length || 0})
                    </span>
                  ),
                  children: (
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      <Timeline>
                        {selectedEmployee.attendance_records?.map((record) => (
                          <Timeline.Item
                            key={`${record.date}-${record.employee_id}`}
                            color={record.status === 'present' ? 'green' : 'red'}
                            dot={record.has_active_session ? <ClockCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
                          >
                            <Card size="small" style={{ marginBottom: 8 }}>
                              <Row gutter={16} align="middle">
                                <Col span={6}>
                                  <div style={{ fontWeight: 'bold' }}>
                                    {dayjs(record.date).format('ddd, MMM DD, YYYY')}
                                  </div>
                                </Col>
                                <Col span={4}>
                                  <Tag color="blue">
                                    <ClockCircleOutlined /> {record.first_clock_in}
                                  </Tag>
                                </Col>
                                <Col span={4}>
                                  {record.last_clock_out ? (
                                    <Tag color="orange">
                                      <ClockCircleOutlined /> {record.last_clock_out}
                                    </Tag>
                                  ) : (
                                    <Tag color="processing">Active</Tag>
                                  )}
                                </Col>
                                <Col span={4}>
                                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                    {record.total_working_hours || '-'}
                                  </span>
                                </Col>
                                <Col span={3}>
                                  <Tag color="purple">{record.session_count} sessions</Tag>
                                </Col>
                                <Col span={3}>
                                  <Tag color={record.status === 'present' ? 'green' : 'red'}>
                                    {record.status}
                                  </Tag>
                                </Col>
                              </Row>
                              {record.notes && (
                                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                                  <FileTextOutlined /> {record.notes}
                                </div>
                              )}
                            </Card>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </div>
                  ),
                },
                {
                  key: 'leaves',
                  label: (
                    <span>
                      <CalendarOutlined />
                      Leave Requests ({selectedEmployee.leave_requests?.length || 0})
                    </span>
                  ),
                  children: (
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {selectedEmployee.leave_requests && selectedEmployee.leave_requests.length > 0 ? (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {selectedEmployee.leave_requests.map((leave) => (
                            <Card key={leave.id} size="small">
                              <Row gutter={16} align="middle">
                                <Col span={6}>
                                  <div>
                                    <Tag color={getLeaveTypeColor(leave.leave_type)}>
                                      {leave.leave_type.toUpperCase()}
                                    </Tag>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                    {leave.total_days} day{leave.total_days > 1 ? 's' : ''}
                                  </div>
                                </Col>
                                <Col span={6}>
                                  <div style={{ fontSize: '12px', color: '#666' }}>Start Date</div>
                                  <div style={{ fontWeight: 500 }}>
                                    {dayjs(leave.start_date).format('MMM DD, YYYY')}
                                  </div>
                                </Col>
                                <Col span={6}>
                                  <div style={{ fontSize: '12px', color: '#666' }}>End Date</div>
                                  <div style={{ fontWeight: 500 }}>
                                    {dayjs(leave.end_date).format('MMM DD, YYYY')}
                                  </div>
                                </Col>
                                <Col span={6}>
                                  <Tag
                                    color={getLeaveStatusColor(leave.status)}
                                    style={{ fontSize: '13px', padding: '4px 12px' }}
                                  >
                                    {leave.status.toUpperCase()}
                                  </Tag>
                                </Col>
                              </Row>
                              {leave.reason && (
                                <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                                    <FileTextOutlined /> Reason:
                                  </div>
                                  <div style={{ fontSize: '13px' }}>{leave.reason}</div>
                                </div>
                              )}
                              {leave.approved_by && (
                                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                                  <CheckCircleOutlined /> Approved by: {leave.approved_by}
                                </div>
                              )}
                              <div style={{ marginTop: 4, fontSize: '11px', color: '#999' }}>
                                Requested: {dayjs(leave.created_at).format('MMM DD, YYYY HH:mm')}
                              </div>
                            </Card>
                          ))}
                        </Space>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                          <CalendarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                          <div>No leave requests found</div>
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}