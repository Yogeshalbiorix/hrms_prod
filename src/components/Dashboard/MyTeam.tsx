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
  message,
  Input,
  Select,
  Modal,
  Table,
  Tooltip,
  Badge,
  Drawer,
  Tabs
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  EnvironmentOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface TeamMember {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department_name?: string;
  join_date: string;
  hire_date?: string;
  profile_image?: string;
  city?: string;
  status: string;
  base_salary?: number;
  employment_type?: string;
  manager_id?: number;
}

interface CurrentUser {
  id: number;
  employee_id?: number;
  first_name: string;
  last_name: string;
  position: string;
  department_name?: string;
  profile_image?: string;
  email?: string;
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  working_hours: string | null;
  status: string;
}

export default function MyTeam() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Record<number, AttendanceRecord>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [memberAttendance, setMemberAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTeamMembers();
      fetchTeamAttendance();
    }
  }, [currentUser]);

  useEffect(() => {
    filterTeamMembers();
  }, [teamMembers, searchTerm, statusFilter]);

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
      message.error('Failed to load current user');
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

      if (data.success && Array.isArray(data.data)) {
        // Filter employees who report to current user and exclude terminated employees
        const myTeam = data.data.filter((emp: any) =>
          emp.manager_id === currentUser?.employee_id && emp.status !== 'terminated'
        );
        setTeamMembers(myTeam);
        setFilteredMembers(myTeam);
      } else {
        setTeamMembers([]);
        setFilteredMembers([]);
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

      if (data.success && Array.isArray(data.data)) {
        const attendanceMap: Record<number, AttendanceRecord> = {};
        data.data.forEach((record: any) => {
          if (record.employee_id) {
            attendanceMap[record.employee_id] = record;
          }
        });
        setTodayAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching team attendance:', error);
    }
  };

  const filterTeamMembers = () => {
    let filtered = [...teamMembers];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.first_name.toLowerCase().includes(search) ||
          member.last_name.toLowerCase().includes(search) ||
          member.email.toLowerCase().includes(search) ||
          member.employee_id.toLowerCase().includes(search) ||
          member.position.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((member) => member.status === statusFilter);
    }

    setFilteredMembers(filtered);
  };

  const handleRefresh = () => {
    fetchTeamMembers();
    fetchTeamAttendance();
    message.success('Data refreshed');
  };

  const handleViewMember = async (member: TeamMember) => {
    setSelectedMember(member);
    setDrawerVisible(true);
    fetchMemberDetails(member.id);
  };

  const fetchMemberDetails = async (employeeId: number) => {
    try {
      setLoadingDetails(true);
      const sessionToken = localStorage.getItem('sessionToken');

      // Fetch attendance history for the last 30 days
      const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');

      const response = await fetch(`/api/attendance?employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const data = await response.json() as any;

      if (data.success && Array.isArray(data.data)) {
        setMemberAttendance(data.data);
      } else {
        setMemberAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      setMemberAttendance([]);
    } finally {
      setLoadingDetails(false);
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

  const getAttendanceStatus = (employeeId: number): { color: string; text: string; icon: any } => {
    const attendance = todayAttendance[employeeId];

    if (!attendance || !attendance.check_in_time) {
      return { color: 'default', text: 'Absent', icon: <CloseCircleOutlined /> };
    }

    if (attendance.check_in_time && !attendance.check_out_time) {
      return { color: 'success', text: 'Active', icon: <ClockCircleOutlined /> };
    }

    if (attendance.check_in_time && attendance.check_out_time) {
      return { color: 'processing', text: 'Checked Out', icon: <CheckCircleOutlined /> };
    }

    return { color: 'default', text: 'Unknown', icon: <UserOutlined /> };
  };

  const getTeamStats = () => {
    const active = teamMembers.filter(member => getActivityStatus(member.id) === 'active').length;
    const present = Object.values(todayAttendance).filter((att) =>
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

  // Table columns for table view
  const columns: ColumnsType<TeamMember> = [
    {
      title: 'Employee',
      key: 'employee',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.profile_image}
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.first_name.charAt(0)}{record.last_name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.first_name} {record.last_name}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.employee_id}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 180,
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 150,
      render: (dept) => dept || 'N/A',
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: 12 }}>
            <MailOutlined style={{ marginRight: 4 }} />
            {record.email}
          </Text>
          {record.phone && (
            <Text style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : 'default'}>
          {record.status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Today',
      key: 'today',
      width: 130,
      render: (_, record) => {
        const status = getAttendanceStatus(record.id);
        return (
          <Tag icon={status.icon} color={status.color}>
            {status.text}
          </Tag>
        );
      },
    },
    {
      title: 'Join Date',
      key: 'join_date',
      width: 120,
      render: (_, record) => dayjs(record.join_date || record.hire_date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewMember(record)}
        >
          View
        </Button>
      ),
    },
  ];

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Section */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row align="middle" gutter={24}>
          <Col>
            <Avatar
              size={80}
              src={currentUser.profile_image}
              style={{
                backgroundColor: 'white',
                color: '#667eea',
                fontSize: '32px',
                fontWeight: 'bold',
                border: '4px solid rgba(255,255,255,0.3)'
              }}
            >
              {currentUser.first_name.charAt(0)}{currentUser.last_name.charAt(0)}
            </Avatar>
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              {currentUser.first_name} {currentUser.last_name}
            </Title>
            <Paragraph style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              <strong>{currentUser.position}</strong>
              {currentUser.department_name && ` • ${currentUser.department_name}`}
            </Paragraph>
            <Tag
              color="rgba(255,255,255,0.2)"
              style={{
                marginTop: 8,
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '14px'
              }}
            >
              <TeamOutlined /> Team Manager
            </Tag>
          </Col>
          <Col>
            <Card
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)'
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Direct Reports</span>}
                value={teamMembers.length}
                prefix={<TeamOutlined style={{ color: 'white' }} />}
                valueStyle={{ color: 'white', fontSize: '32px' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Team Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: '4px solid #1890ff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Statistic
              title={<span style={{ color: '#666', fontSize: '14px' }}>Total Team Members</span>}
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1890ff', fontSize: '24px' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: '4px solid #52c41a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Statistic
              title={<span style={{ color: '#666', fontSize: '14px' }}>Active Now</span>}
              value={stats.active}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: '4px solid #13c2c2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Statistic
              title={<span style={{ color: '#666', fontSize: '14px' }}>Present Today</span>}
              value={stats.present}
              prefix={<CheckCircleOutlined style={{ color: '#13c2c2', fontSize: '24px' }} />}
              valueStyle={{ color: '#13c2c2', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: '4px solid #ff4d4f',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Statistic
              title={<span style={{ color: '#666', fontSize: '14px' }}>Absent Today</span>}
              value={stats.absent}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Section */}
      <Card
        style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}
        bodyStyle={{ padding: '20px' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={8}>
            <Search
              placeholder="Search by name, email, ID, or position..."
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} lg={4}>
            <Select
              size="large"
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="on-leave">On Leave</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} lg={4}>
            <Space>
              <Tooltip title="Grid View">
                <Button
                  size="large"
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                />
              </Tooltip>
              <Tooltip title="Table View">
                <Button
                  size="large"
                  type={viewMode === 'table' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('table')}
                />
              </Tooltip>
            </Space>
          </Col>
          <Col xs={24} sm={12} lg={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
              <Badge count={filteredMembers.length} showZero>
                <Button size="large" type="primary" icon={<TeamOutlined />}>
                  Team Members
                </Button>
              </Badge>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Team Members Content */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Loading team members..." />
        </Card>
      ) : filteredMembers.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '50px' }}>
          <Empty
            description={
              teamMembers.length === 0
                ? "No team members assigned"
                : "No team members match your search"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {teamMembers.length === 0 ? (
              <div>
                <Paragraph type="secondary">
                  You don't have any direct reports assigned yet.
                </Paragraph>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Contact your administrator to assign team members.
                </Text>
              </div>
            ) : (
              <Button type="primary" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                Clear Filters
              </Button>
            )}
          </Empty>
        </Card>
      ) : viewMode === 'grid' ? (
        <Row gutter={[16, 16]}>
          {filteredMembers.map((member) => {
            const attendanceStatus = getAttendanceStatus(member.id);
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={member.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    height: '100%'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewMember(member)}
                      key="view"
                    >
                      View Details
                    </Button>
                  ]}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {/* Avatar with Status Badge */}
                    <div style={{ textAlign: 'center' }}>
                      <Badge
                        dot
                        status={getActivityStatus(member.id) === 'active' ? 'success' : 'default'}
                        offset={[-8, 70]}
                      >
                        <Avatar
                          size={80}
                          src={member.profile_image}
                          style={{
                            backgroundColor: '#1890ff',
                            fontSize: '32px',
                            fontWeight: 'bold',
                          }}
                        >
                          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </div>

                    {/* Name & Position */}
                    <div style={{ textAlign: 'center' }}>
                      <Title level={5} style={{ margin: '8px 0 4px', fontSize: '16px' }}>
                        {member.first_name} {member.last_name}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>
                        {member.position}
                      </Text>
                      <Tag
                        color="blue"
                        style={{ marginTop: '8px', fontSize: '11px' }}
                      >
                        {member.employee_id}
                      </Tag>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Details */}
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {member.department_name && (
                        <Tooltip title="Department">
                          <Text style={{ fontSize: '12px' }} ellipsis>
                            <BankOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                            {member.department_name}
                          </Text>
                        </Tooltip>
                      )}
                      <Tooltip title={member.email}>
                        <Text style={{ fontSize: '12px' }} ellipsis>
                          <MailOutlined style={{ marginRight: 8, color: '#faad14' }} />
                          {member.email}
                        </Text>
                      </Tooltip>
                      {member.phone && (
                        <Text style={{ fontSize: '12px' }}>
                          <PhoneOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                          {member.phone}
                        </Text>
                      )}
                      <Text style={{ fontSize: '12px' }}>
                        <CalendarOutlined style={{ marginRight: 8, color: '#13c2c2' }} />
                        Joined {dayjs(member.join_date || member.hire_date).format('MMM YYYY')}
                      </Text>
                    </Space>

                    {/* Status Tags */}
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <Space wrap>
                        <Tag
                          color={member.status === 'active' ? 'success' : member.status === 'on-leave' ? 'warning' : 'default'}
                        >
                          {member.status.toUpperCase()}
                        </Tag>
                        <Tag icon={attendanceStatus.icon} color={attendanceStatus.color}>
                          {attendanceStatus.text}
                        </Tag>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={filteredMembers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} members`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1200 }}
            loading={loading}
          />
        </Card>
      )}

      {/* Member Details Drawer */}
      <Drawer
        title={
          selectedMember ? (
            <Space>
              <Avatar
                src={selectedMember.profile_image}
                style={{ backgroundColor: '#1890ff' }}
              >
                {selectedMember.first_name.charAt(0)}{selectedMember.last_name.charAt(0)}
              </Avatar>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedMember.first_name} {selectedMember.last_name}
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {selectedMember.position}
                </Text>
              </div>
            </Space>
          ) : 'Employee Details'
        }
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedMember && (
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  Profile
                </span>
              }
              key="1"
            >
              <Card bordered={false}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Employee ID">
                    <Tag color="blue">{selectedMember.employee_id}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Full Name">
                    {selectedMember.first_name} {selectedMember.last_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <a href={`mailto:${selectedMember.email}`}>{selectedMember.email}</a>
                  </Descriptions.Item>
                  {selectedMember.phone && (
                    <Descriptions.Item label="Phone">
                      <a href={`tel:${selectedMember.phone}`}>{selectedMember.phone}</a>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Position">
                    {selectedMember.position}
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    {selectedMember.department_name || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Employment Type">
                    <Tag>{selectedMember.employment_type || 'N/A'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={selectedMember.status === 'active' ? 'success' : 'default'}>
                      {selectedMember.status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Join Date">
                    {dayjs(selectedMember.join_date || selectedMember.hire_date).format('MMMM DD, YYYY')}
                  </Descriptions.Item>
                  {selectedMember.city && (
                    <Descriptions.Item label="Location">
                      {selectedMember.city}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Today's Status">
                    {(() => {
                      const status = getAttendanceStatus(selectedMember.id);
                      return <Tag icon={status.icon} color={status.color}>{status.text}</Tag>;
                    })()}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <HistoryOutlined />
                  Attendance History
                </span>
              }
              key="2"
            >
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin tip="Loading attendance history..." />
                </div>
              ) : memberAttendance.length === 0 ? (
                <Empty
                  description="No attendance records found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Timeline mode="left">
                  {memberAttendance.slice(0, 15).map((record) => (
                    <Timeline.Item
                      key={record.id}
                      color={record.check_in_time ? 'green' : 'gray'}
                      dot={record.check_in_time ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      label={
                        <Text strong>
                          {dayjs(record.date).format('MMM DD, YYYY')}
                        </Text>
                      }
                    >
                      <Card size="small" style={{ marginTop: -8 }}>
                        <Space direction="vertical" size="small">
                          <Space>
                            <Tag color={record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'default'}>
                              {record.status?.toUpperCase() || 'N/A'}
                            </Tag>
                            {record.working_hours && (
                              <Text type="secondary">
                                <ClockCircleOutlined /> {record.working_hours}
                              </Text>
                            )}
                          </Space>
                          {record.check_in_time && (
                            <Text style={{ fontSize: '12px' }}>
                              In: <strong>{dayjs(record.check_in_time).format('hh:mm A')}</strong>
                              {record.check_out_time && (
                                <> | Out: <strong>{dayjs(record.check_out_time).format('hh:mm A')}</strong></>
                              )}
                            </Text>
                          )}
                        </Space>
                      </Card>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
}
