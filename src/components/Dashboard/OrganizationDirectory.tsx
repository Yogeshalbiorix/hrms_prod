import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Space,
  Input,
  Select,
  Tag,
  Divider,
  Spin,
  Empty,
  Badge,
  message,
  Drawer,
  Descriptions,
  Button,
  Tabs,
  Table,
  Statistic,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  FilterOutlined,
  UserOutlined,
  BankOutlined,
  CalendarOutlined,
  IdcardOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HomeOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  EditOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department_id: number;
  department_name?: string;
  hire_date: string;
  salary?: number;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  profile_image?: string;
  activity_status?: 'active' | 'inactive';
}

interface Department {
  id: number;
  name: string;
}

export default function OrganizationDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [todayAttendance, setTodayAttendance] = useState<Record<number, any>>({});

  useEffect(() => {
    const loadData = async () => {
      await fetchTodayAttendance();
      await fetchEmployees();
      await fetchDepartments();
    };

    loadData();
    // Refresh attendance status every 30 seconds
    const interval = setInterval(() => {
      fetchTodayAttendance();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async () => {
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
        // Filter out terminated employees from organization directory
        const activeEmployees = data.data.filter((emp: Employee) => emp.status !== 'terminated');
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/departments', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json() as any;

      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchTodayAttendance = async () => {
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
        console.log('Today Attendance Data:', data.data);
        // Create a map of employee_id to attendance record
        const attendanceMap: Record<number, any> = {};
        data.data.forEach((record: any) => {
          attendanceMap[record.employee_id] = record;
        });
        console.log('Attendance Map:', attendanceMap);
        setTodayAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      setLoadingDetails(true);
      const sessionToken = localStorage.getItem('sessionToken');

      // Fetch attendance data
      const attendanceResponse = await fetch(
        `/api/attendance?employee_id=${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
      const attendanceResult = await attendanceResponse.json() as any;
      if (attendanceResult.success) {
        setAttendanceData(attendanceResult.data);
      }

      // Fetch leave data
      const leaveResponse = await fetch(`/api/leaves?employee_id=${employeeId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const leaveResult = await leaveResponse.json() as any;
      if (leaveResult.success) {
        setLeaveData(leaveResult.data);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDrawerVisible(true);
    fetchEmployeeDetails(employee.id);
  };

  const handleEditAttendance = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      attendance_date: dayjs(record.attendance_date),
      check_in_time: record.check_in_time ? dayjs(record.check_in_time, 'HH:mm:ss') : null,
      check_out_time: record.check_out_time ? dayjs(record.check_out_time, 'HH:mm:ss') : null,
      status: record.status,
    });
    setEditModalVisible(true);
  };

  const handleUpdateAttendance = async () => {
    try {
      const values = await form.validateFields();
      const sessionToken = localStorage.getItem('sessionToken');

      const updateData = {
        attendance_date: values.attendance_date.format('YYYY-MM-DD'),
        check_in_time: values.check_in_time ? values.check_in_time.format('HH:mm:ss') : null,
        check_out_time: values.check_out_time ? values.check_out_time.format('HH:mm:ss') : null,
        status: values.status,
      };

      const response = await fetch(`/api/attendance/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json() as any;

      if (result.success) {
        message.success('Attendance record updated successfully');
        setEditModalVisible(false);
        form.resetFields();
        setEditingRecord(null);
        // Refresh attendance data
        if (selectedEmployee) {
          fetchEmployeeDetails(selectedEmployee.id);
        }
      } else {
        message.error(result.error || 'Failed to update attendance record');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      message.error('Failed to update attendance record');
    }
  };

  const handleDeleteAttendance = async (recordId: number) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');

      const response = await fetch(`/api/attendance/${recordId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const result = await response.json() as any;

      if (result.success) {
        message.success('Attendance record deleted successfully');
        // Refresh attendance data
        if (selectedEmployee) {
          fetchEmployeeDetails(selectedEmployee.id);
        }
      } else {
        message.error(result.error || 'Failed to delete attendance record');
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      message.error('Failed to delete attendance record');
    }
  };

  const getFilteredEmployees = () => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchQuery === '' ||
        `${emp.first_name} ${emp.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment =
        !filterDepartment || emp.department_id === parseInt(filterDepartment);

      const matchesLocation =
        !filterLocation ||
        emp.city?.toLowerCase().includes(filterLocation.toLowerCase());

      return matchesSearch && matchesDepartment && matchesLocation;
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      inactive: 'default',
      'on-leave': 'warning',
      terminated: 'error',
    };
    return colors[status] || 'default';
  };

  const getActivityStatus = (employeeId: number): 'active' | 'inactive' => {
    const attendance = todayAttendance[employeeId];
    console.log(`Checking activity for employee ${employeeId}:`, attendance);

    if (!attendance) return 'inactive';

    // Active if clocked in but not clocked out
    // API returns check_in_time and check_out_time fields
    if (attendance.check_in_time && !attendance.check_out_time) {
      console.log(`Employee ${employeeId} is ACTIVE - clocked in at ${attendance.check_in_time}`);
      return 'active';
    }

    console.log(`Employee ${employeeId} is INACTIVE`);
    return 'inactive';
  };

  const getActivityBadgeStatus = (employeeId: number): 'success' | 'error' | 'default' => {
    return getActivityStatus(employeeId) === 'active' ? 'success' : 'error';
  };

  const filteredEmployees = getFilteredEmployees();
  const locations = [...new Set(employees.map((e) => e.city).filter(Boolean))];

  const attendanceColumns = [
    {
      title: 'Date',
      dataIndex: 'attendance_date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Check In',
      dataIndex: 'check_in_time',
      key: 'check_in',
      render: (time: string) => time ? <Tag color="blue">{time}</Tag> : '-',
    },
    {
      title: 'Check Out',
      dataIndex: 'check_out_time',
      key: 'check_out',
      render: (time: string) => time ? <Tag color="orange">{time}</Tag> : <Tag color="processing">Active</Tag>,
    },
    {
      title: 'Working Hours',
      dataIndex: 'working_hours',
      key: 'working_hours',
      render: (hours: string) => hours || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: any = {
          present: 'success',
          late: 'warning',
          absent: 'error',
          'half-day': 'processing'
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditAttendance(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete attendance record?"
            description="Are you sure you want to delete this attendance record?"
            onConfirm={() => handleDeleteAttendance(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const leaveColumns = [
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type: string) => <Tag color="blue">{type?.toUpperCase()}</Tag>,
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
      title: 'Days',
      dataIndex: 'total_days',
      key: 'total_days',
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
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Organization Directory
          </Title>
          <Text type="secondary">
            {filteredEmployees.length} of {employees.length} employees
          </Text>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={10}>
            <Search
              placeholder="Search by name, employee ID, email, or position..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={7}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Department"
              value={filterDepartment || undefined}
              onChange={setFilterDepartment}
              allowClear
              size="large"
              suffixIcon={<FilterOutlined />}
            >
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={7}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Location"
              value={filterLocation || undefined}
              onChange={setFilterLocation}
              allowClear
              size="large"
              suffixIcon={<EnvironmentOutlined />}
            >
              {locations.map((location) => (
                <Select.Option key={location} value={location}>
                  {location}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Employee Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <Empty description="No employees found" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredEmployees.map((employee) => (
            <Col xs={24} sm={12} md={8} lg={6} key={employee.id}>
              <Card
                hoverable
                onClick={() => handleEmployeeClick(employee)}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {/* Avatar */}
                  <div style={{ textAlign: 'center' }}>
                    <Badge
                      dot
                      status={getActivityBadgeStatus(employee.id)}
                      offset={[-10, 10]}
                    >
                      <Avatar
                        size={80}
                        src={employee.profile_image}
                        style={{
                          backgroundColor: '#1890ff',
                          fontSize: '28px',
                        }}
                      >
                        {getInitials(employee.first_name, employee.last_name)}
                      </Avatar>
                    </Badge>
                  </div>

                  {/* Name & Status */}
                  <div style={{ textAlign: 'center' }}>
                    <Title level={5} style={{ margin: '8px 0 4px' }}>
                      {employee.first_name} {employee.last_name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {employee.position}
                    </Text>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  {/* Details */}
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text style={{ fontSize: '12px' }}>
                      <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      Department: <strong>{employee.department_name}</strong>
                    </Text>
                    <Text style={{ fontSize: '12px' }}>
                      <EnvironmentOutlined
                        style={{ marginRight: 8, color: '#52c41a' }}
                      />
                      Location: <strong>{employee.city || 'N/A'}</strong>
                    </Text>
                    <Text style={{ fontSize: '12px' }} ellipsis>
                      <MailOutlined style={{ marginRight: 8, color: '#faad14' }} />
                      {employee.email}
                    </Text>
                    {employee.phone && (
                      <Text style={{ fontSize: '12px' }}>
                        <PhoneOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                        {employee.phone}
                      </Text>
                    )}
                  </Space>

                  {/* Footer Tag */}
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <Space>
                      <Tag color={getStatusColor(employee.status)}>
                        {employee.status.toUpperCase()}
                      </Tag>
                      <Tag
                        icon={getActivityStatus(employee.id) === 'active' ? <ClockCircleOutlined /> : <CloseCircleOutlined />}
                        color={getActivityStatus(employee.id) === 'active' ? 'success' : 'default'}
                      >
                        {getActivityStatus(employee.id) === 'active' ? 'ACTIVE' : 'INACTIVE'}
                      </Tag>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Employee Detail Drawer */}
      <Drawer
        title={
          selectedEmployee ? (
            <Space>
              <Avatar
                size={48}
                src={selectedEmployee.profile_image}
                style={{ backgroundColor: '#1890ff' }}
              >
                {getInitials(selectedEmployee.first_name, selectedEmployee.last_name)}
              </Avatar>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </Typography.Title>
                <Typography.Text type="secondary">{selectedEmployee.position}</Typography.Text>
              </div>
            </Space>
          ) : (
            'Employee Details'
          )
        }
        placement="right"
        onClose={() => {
          setDrawerVisible(false);
          setSelectedEmployee(null);
          setAttendanceData([]);
          setLeaveData([]);
        }}
        open={drawerVisible}
        width={720}
      >
        {selectedEmployee && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <UserOutlined />
                    Personal Info
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Status Badge */}
                    <Card size="small">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Employee Status"
                            value={selectedEmployee.status}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Employee ID"
                            value={selectedEmployee.employee_id}
                            valueStyle={{ fontSize: '16px' }}
                            prefix={<IdcardOutlined />}
                          />
                        </Col>
                      </Row>
                    </Card>

                    {/* Basic Information */}
                    <Card title="Basic Information" size="small">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item
                          label={
                            <span>
                              <UserOutlined style={{ marginRight: 8 }} />
                              Full Name
                            </span>
                          }
                        >
                          {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={
                            <span>
                              <MailOutlined style={{ marginRight: 8 }} />
                              Email
                            </span>
                          }
                        >
                          <a href={`mailto:${selectedEmployee.email}`}>
                            {selectedEmployee.email}
                          </a>
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={
                            <span>
                              <PhoneOutlined style={{ marginRight: 8 }} />
                              Phone
                            </span>
                          }
                        >
                          {selectedEmployee.phone || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={
                            <span>
                              <IdcardOutlined style={{ marginRight: 8 }} />
                              Employee ID
                            </span>
                          }
                        >
                          {selectedEmployee.employee_id}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Work Information */}
                    <Card title="Work Information" size="small">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item
                          label={
                            <span>
                              <BankOutlined style={{ marginRight: 8 }} />
                              Position
                            </span>
                          }
                        >
                          {selectedEmployee.position}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={
                            <span>
                              <TeamOutlined style={{ marginRight: 8 }} />
                              Department
                            </span>
                          }
                        >
                          {selectedEmployee.department_name}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={
                            <span>
                              <CalendarOutlined style={{ marginRight: 8 }} />
                              Hire Date
                            </span>
                          }
                        >
                          {dayjs(selectedEmployee.hire_date).format('MMMM DD, YYYY')}
                        </Descriptions.Item>
                        {selectedEmployee.salary && (
                          <Descriptions.Item
                            label={
                              <span>
                                <DollarOutlined style={{ marginRight: 8 }} />
                                Salary
                              </span>
                            }
                          >
                            ${selectedEmployee.salary.toLocaleString()}
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>

                    {/* Address Information */}
                    {(selectedEmployee.address ||
                      selectedEmployee.city ||
                      selectedEmployee.state) && (
                        <Card title="Address Information" size="small">
                          <Descriptions column={1} size="small">
                            {selectedEmployee.address && (
                              <Descriptions.Item
                                label={
                                  <span>
                                    <HomeOutlined style={{ marginRight: 8 }} />
                                    Address
                                  </span>
                                }
                              >
                                {selectedEmployee.address}
                              </Descriptions.Item>
                            )}
                            {selectedEmployee.city && (
                              <Descriptions.Item label="City">
                                {selectedEmployee.city}
                              </Descriptions.Item>
                            )}
                            {selectedEmployee.state && (
                              <Descriptions.Item label="State">
                                {selectedEmployee.state}
                              </Descriptions.Item>
                            )}
                            {selectedEmployee.country && (
                              <Descriptions.Item
                                label={
                                  <span>
                                    <GlobalOutlined style={{ marginRight: 8 }} />
                                    Country
                                  </span>
                                }
                              >
                                {selectedEmployee.country}
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </Card>
                      )}

                    {/* Emergency Contact */}
                    {(selectedEmployee.emergency_contact_name ||
                      selectedEmployee.emergency_contact_phone) && (
                        <Card title="Emergency Contact" size="small">
                          <Descriptions column={1} size="small">
                            {selectedEmployee.emergency_contact_name && (
                              <Descriptions.Item label="Contact Name">
                                {selectedEmployee.emergency_contact_name}
                              </Descriptions.Item>
                            )}
                            {selectedEmployee.emergency_contact_phone && (
                              <Descriptions.Item label="Contact Phone">
                                {selectedEmployee.emergency_contact_phone}
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </Card>
                      )}
                  </Space>
                ),
              },
              {
                key: '2',
                label: (
                  <span>
                    <ClockCircleOutlined />
                    Attendance ({attendanceData.length})
                  </span>
                ),
                children: loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin />
                  </div>
                ) : (
                  <Table
                    columns={attendanceColumns}
                    dataSource={attendanceData}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                ),
              },
              {
                key: '3',
                label: (
                  <span>
                    <FileTextOutlined />
                    Leave History ({leaveData.length})
                  </span>
                ),
                children: loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin />
                  </div>
                ) : (
                  <Table
                    columns={leaveColumns}
                    dataSource={leaveData}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Edit Attendance Modal */}
      <Modal
        title="Edit Attendance Record"
        open={editModalVisible}
        onOk={handleUpdateAttendance}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        okText="Update"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="attendance_date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="check_in_time"
                label="Check In Time"
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="check_out_time"
                label="Check Out Time"
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              options={[
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'half-day', label: 'Half Day' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
