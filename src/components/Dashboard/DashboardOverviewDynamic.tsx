import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Table,
  Tag,
  Space,
  Avatar,
  Button,
  Spin,
  Typography,
  Divider,
  Alert,
  Timeline,
  List,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  CalendarOutlined,
  BankOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  onLeave: number;
  absent: number;
  pendingLeaves: number;
  totalPayroll: number;
  avgPerformance: number;
}

interface Employee {
  id: number;
  status: string;
}

interface AttendanceRecord {
  status: string;
  attendance_date: string;
}

interface LeaveRecord {
  status: string;
}

interface PayrollRecord {
  net_salary: number;
  status: string;
}

interface RecentActivity {
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

interface Department {
  id: number;
  name: string;
  employeeCount?: number;
}

export default function DashboardOverviewDynamic() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    absent: 0,
    pendingLeaves: 0,
    totalPayroll: 0,
    avgPerformance: 4.2
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch all required data in parallel
      const [employeesRes, attendanceRes, leavesRes, payrollRes, departmentsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance'),
        fetch('/api/leaves'),
        fetch('/api/payroll'),
        fetch('/api/departments')
      ]);

      const employees = await employeesRes.json() as any;
      const attendance = await attendanceRes.json() as any;
      const leaves = await leavesRes.json() as any;
      const payroll = await payrollRes.json() as any;
      const depts = await departmentsRes.json() as any;

      // Calculate statistics
      const allEmployeeData = employees.data || [];
      // Filter out terminated employees from dashboard
      const employeeData = allEmployeeData.filter((e: Employee) => e.status !== 'terminated');
      const attendanceData = attendance.data || [];
      const leaveData = leaves.data || [];
      const payrollData = payroll.data || [];
      const departmentData = depts.data || [];

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Calculate attendance stats for today
      const todayAttendance = attendanceData.filter((a: AttendanceRecord) =>
        a.attendance_date === today
      );
      const presentCount = todayAttendance.filter((a: AttendanceRecord) =>
        a.status === 'present' || a.status === 'late'
      ).length;
      const absentCount = todayAttendance.filter((a: AttendanceRecord) =>
        a.status === 'absent'
      ).length;

      // Calculate leave stats
      const onLeaveCount = todayAttendance.filter((a: AttendanceRecord) =>
        a.status === 'on-leave'
      ).length;
      const pendingLeavesCount = leaveData.filter((l: LeaveRecord) =>
        l.status === 'pending'
      ).length;

      // Calculate payroll
      const approvedPayroll = payrollData.filter((p: PayrollRecord) =>
        p.status === 'approved' || p.status === 'paid'
      );
      const totalPayrollAmount = approvedPayroll.reduce((sum: number, p: PayrollRecord) =>
        sum + (p.net_salary || 0), 0
      );

      // Count active employees (already filtered out terminated above)
      const activeCount = employeeData.filter((e: Employee) =>
        e.status === 'active'
      ).length;

      // Count employees per department (only non-terminated)
      const departmentCounts: { [key: number]: number } = {};
      employeeData.forEach((emp: any) => {
        if (emp.department_id) {
          departmentCounts[emp.department_id] = (departmentCounts[emp.department_id] || 0) + 1;
        }
      });

      const departmentsWithCounts = departmentData.map((dept: Department) => ({
        ...dept,
        employeeCount: departmentCounts[dept.id] || 0
      }));

      setStats({
        totalEmployees: employeeData.length,
        activeEmployees: activeCount,
        presentToday: presentCount,
        onLeave: onLeaveCount,
        absent: absentCount,
        pendingLeaves: pendingLeavesCount,
        totalPayroll: totalPayrollAmount,
        avgPerformance: 4.2
      });

      setDepartments(departmentsWithCounts);

      // Generate recent activities
      const activities: RecentActivity[] = [];

      // Recent employee additions
      const recentEmployees = employeeData.slice(-3);
      recentEmployees.forEach((emp: any, index: number) => {
        activities.push({
          action: `${emp.first_name} ${emp.last_name} joined as ${emp.position}`,
          time: `${index + 1} day${index > 0 ? 's' : ''} ago`,
          type: 'success'
        });
      });

      // Recent leave approvals
      const recentLeaves = leaveData.filter((l: LeaveRecord) =>
        l.status === 'approved'
      ).slice(-2);
      recentLeaves.forEach((leave: any, index: number) => {
        activities.push({
          action: `Leave request approved`,
          time: `${index + 2} hours ago`,
          type: 'info'
        });
      });

      // Pending leaves as warnings
      if (pendingLeavesCount > 0) {
        activities.push({
          action: `${pendingLeavesCount} leave request${pendingLeavesCount > 1 ? 's' : ''} pending approval`,
          time: 'Now',
          type: 'warning'
        });
      }

      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <Paragraph style={{ marginTop: 16, color: '#8c8c8c' }}>
          Loading dashboard data...
        </Paragraph>
      </div>
    );
  }

  const attendanceRate = stats.totalEmployees > 0
    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)
    : '0';

  return (
    <div>
      {/* Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Employees</span>}
              value={stats.totalEmployees}
              prefix={<TeamOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
              suffix={
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {stats.activeEmployees} active
                </Tag>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Present Today</span>}
              value={stats.presentToday}
              prefix={<CheckCircleOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
              suffix={
                <Tag color="success" style={{ marginLeft: 8 }}>
                  {attendanceRate}%
                </Tag>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>On Leave</span>}
              value={stats.onLeave}
              prefix={<CalendarOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
              suffix={
                stats.pendingLeaves > 0 ? (
                  <Tag color="warning" style={{ marginLeft: 8 }}>
                    {stats.pendingLeaves} pending
                  </Tag>
                ) : null
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Absent</span>}
              value={stats.absent}
              prefix={<CloseCircleOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
              suffix={
                <Tag color="error" style={{ marginLeft: 8 }}>
                  {((stats.absent / stats.totalEmployees) * 100).toFixed(1)}%
                </Tag>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title="Pending Approvals"
              value={stats.pendingLeaves}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress
              percent={stats.pendingLeaves > 0 ? 100 : 0}
              strokeColor="#722ed1"
              showInfo={false}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title="Monthly Payroll"
              value={stats.totalPayroll / 1000}
              precision={1}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="K"
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stats.activeEmployees} employees
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title="Departments"
              value={departments.length}
              prefix={<BankOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Active departments
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title="Avg Performance"
              value={stats.avgPerformance}
              precision={1}
              prefix={<TrophyOutlined style={{ color: '#fa8c16' }} />}
              suffix="/ 5"
              valueStyle={{ color: '#fa8c16' }}
            />
            <Progress
              percent={(stats.avgPerformance / 5) * 100}
              strokeColor="#fa8c16"
              showInfo={false}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Attendance and Activity Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Attendance Summary */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>Today's Attendance Summary</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card
                  bordered={false}
                  style={{
                    background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
                    borderRadius: 8,
                  }}
                >
                  <Space direction="vertical" size={4}>
                    <Space>
                      <CheckCircleOutlined style={{ fontSize: 20, color: '#389e0d' }} />
                      <Text strong style={{ color: '#389e0d' }}>
                        Present
                      </Text>
                    </Space>
                    <Title level={2} style={{ margin: 0, color: '#389e0d' }}>
                      {stats.presentToday}
                    </Title>
                    <Text style={{ fontSize: 12, color: '#52c41a' }}>
                      {attendanceRate}% attendance
                    </Text>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card
                  bordered={false}
                  style={{
                    background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                    borderRadius: 8,
                  }}
                >
                  <Space direction="vertical" size={4}>
                    <Space>
                      <CalendarOutlined style={{ fontSize: 20, color: '#d48806' }} />
                      <Text strong style={{ color: '#d48806' }}>
                        On Leave
                      </Text>
                    </Space>
                    <Title level={2} style={{ margin: 0, color: '#d48806' }}>
                      {stats.onLeave}
                    </Title>
                    <Text style={{ fontSize: 12, color: '#d48806' }}>
                      {((stats.onLeave / stats.totalEmployees) * 100).toFixed(1)}% of total
                    </Text>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card
                  bordered={false}
                  style={{
                    background: 'linear-gradient(135deg, #ffa7c4 0%, #e66767 100%)',
                    borderRadius: 8,
                  }}
                >
                  <Space direction="vertical" size={4}>
                    <Space>
                      <CloseCircleOutlined style={{ fontSize: 20, color: '#cf1322' }} />
                      <Text strong style={{ color: '#cf1322' }}>
                        Absent
                      </Text>
                    </Space>
                    <Title level={2} style={{ margin: 0, color: '#cf1322' }}>
                      {stats.absent}
                    </Title>
                    <Text style={{ fontSize: 12, color: '#cf1322' }}>
                      {((stats.absent / stats.totalEmployees) * 100).toFixed(1)}% of total
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Employees"
                  value={stats.totalEmployees}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Active Employees"
                  value={stats.activeEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>

            <Progress
              percent={parseFloat(attendanceRate)}
              strokeColor={{
                from: '#52c41a',
                to: '#73d13d',
              }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span>Recent Activity</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
          >
            <Timeline
              items={
                recentActivities.length > 0
                  ? recentActivities.map((activity, index) => ({
                    key: index,
                    color:
                      activity.type === 'success'
                        ? 'green'
                        : activity.type === 'warning'
                          ? 'orange'
                          : 'blue',
                    children: (
                      <div>
                        <Text strong style={{ fontSize: 13 }}>
                          {activity.action}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {activity.time}
                        </Text>
                      </div>
                    ),
                  }))
                  : [
                    {
                      children: (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          No recent activity
                        </Text>
                      ),
                    },
                  ]
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Department Overview */}
      <Row gutter={[16, 16]}>
        {/* Department Distribution */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BankOutlined style={{ color: '#1890ff' }} />
                <span>Department Distribution</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
          >
            {departments.length > 0 ? (
              <List
                dataSource={departments}
                renderItem={(dept, index) => {
                  const colors = ['#1890ff', '#52c41a', '#722ed1', '#faad14', '#f5222d', '#eb2f96', '#13c2c2'];
                  const color = colors[index % colors.length];
                  const maxCount = Math.max(...departments.map(d => d.employeeCount || 0));
                  const percentage = maxCount > 0 ? ((dept.employeeCount || 0) / maxCount) * 100 : 0;

                  return (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Badge color={color} />
                            <Text strong>{dept.name}</Text>
                          </Space>
                          <Tag color={color}>
                            {dept.employeeCount || 0} employee{dept.employeeCount !== 1 ? 's' : ''}
                          </Tag>
                        </div>
                        <Progress
                          percent={percentage}
                          strokeColor={color}
                          showInfo={false}
                          size="small"
                        />
                      </Space>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 24 }}>
                No departments found
              </Text>
            )}
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                <span>Quick Actions</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button
                block
                size="large"
                icon={<UserOutlined />}
                style={{
                  height: 'auto',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                }}
                onClick={() => { }}
              >
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Add New Employee</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Onboard new team member</div>
                </div>
              </Button>

              <Button
                block
                size="large"
                icon={<CheckCircleOutlined />}
                style={{
                  height: 'auto',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: '#fff',
                  border: 'none',
                }}
                onClick={() => { }}
              >
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Mark Attendance</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Record today's attendance</div>
                </div>
              </Button>

              <Button
                block
                size="large"
                icon={<ClockCircleOutlined />}
                style={{
                  height: 'auto',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: '#fff',
                  border: 'none',
                }}
                onClick={() => { }}
              >
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Review Leave Requests</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {stats.pendingLeaves} pending approval{stats.pendingLeaves !== 1 ? 's' : ''}
                  </div>
                </div>
              </Button>

              <Button
                block
                size="large"
                icon={<DollarOutlined />}
                style={{
                  height: 'auto',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: '#fff',
                  border: 'none',
                }}
                onClick={() => { }}
              >
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Process Payroll</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Generate monthly payroll</div>
                </div>
              </Button>
            </Space>

            {stats.pendingLeaves > 0 && (
              <>
                <Divider />
                <Alert
                  message="Action Required"
                  description={`You have ${stats.pendingLeaves} leave request${stats.pendingLeaves !== 1 ? 's' : ''} pending approval.`}
                  type="warning"
                  showIcon
                  icon={<ClockCircleOutlined />}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
