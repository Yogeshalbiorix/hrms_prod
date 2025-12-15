import React, { useState, useEffect } from 'react';
import { baseUrl } from '../../lib/base-url';
import {
  Modal,
  Tabs,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Divider,
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Tag,
  Tooltip,
  Empty,
  Spin,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ContactsOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  DownloadOutlined,
  TeamOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department_id?: number;
  department_name?: string;
  employment_type?: string;
  status: string;
  join_date: string;
  base_salary?: number;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department_id: '',
    employment_type: 'full-time',
    status: 'active',
    join_date: new Date().toISOString().split('T')[0],
    base_salary: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data?: any[]; error?: string };
      if (data.success) {
        setEmployees(data.data || []);
      } else {
        console.error('Failed to fetch employees:', data.error);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/departments`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data?: any[]; error?: string };
      if (data.success) {
        setDepartments(data.data || []);
      } else {
        console.error('Failed to fetch departments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAddEmployee = async () => {
    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.position || !formData.join_date) {
        Modal.warning({
          title: 'Validation Error',
          content: 'Please fill in all required fields: First Name, Last Name, Email, Position, and Join Date',
        });
        return;
      }

      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
      };

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as { success: boolean; error?: string };
      if (data.success) {
        setShowAddDialog(false);
        resetForm();
        fetchEmployees();
        Modal.success({
          title: 'Success',
          content: 'Employee created successfully!',
        });
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to create employee',
        });
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to create employee. Please try again.',
      });
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : undefined,
      };

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as { success: boolean; error?: string };
      if (data.success) {
        setShowEditDialog(false);
        setSelectedEmployee(null);
        resetForm();
        fetchEmployees();
        Modal.success({
          title: 'Success',
          content: 'Employee updated successfully!',
        });
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to update employee',
        });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to update employee. Please try again.',
      });
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    Modal.confirm({
      title: 'Confirm Termination',
      content: 'Are you sure you want to terminate this employee? This will set their status to "terminated".',
      okText: 'Yes, Terminate',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const sessionToken = localStorage.getItem('sessionToken');
          const response = await fetch(`${baseUrl}/api/employees/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });

          const data = await response.json() as { success: boolean; error?: string };
          if (data.success) {
            fetchEmployees();
            Modal.success({
              title: 'Success',
              content: 'Employee terminated successfully',
            });
          } else {
            Modal.error({
              title: 'Error',
              content: data.error || 'Failed to delete employee',
            });
          }
        } catch (error) {
          console.error('Error deleting employee:', error);
          Modal.error({
            title: 'Error',
            content: 'Failed to delete employee. Please try again.',
          });
        }
      },
    });
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department_id: employee.department_id?.toString() || '',
      employment_type: employee.employment_type || 'full-time',
      status: employee.status || 'active',
      join_date: employee.join_date || '',
      base_salary: employee.base_salary?.toString() || '',
      date_of_birth: employee.date_of_birth || '',
      gender: employee.gender || '',
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      zip_code: employee.zip_code || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department_id: '',
      employment_type: 'full-time',
      status: 'active',
      join_date: new Date().toISOString().split('T')[0],
      base_salary: '',
      date_of_birth: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' || emp.department_id?.toString() === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      active: 'blue',
      'on-leave': 'orange',
      inactive: 'default',
      terminated: 'red',
    };
    return <Tag color={colors[status] || 'blue'}>{status.toUpperCase()}</Tag>;
  };

  const columns: ColumnsType<Employee> = [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>{`${record.first_name} ${record.last_name}`}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (email) => (
        <Space>
          <MailOutlined />
          <span>{email}</span>
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Join Date',
      dataIndex: 'join_date',
      key: 'join_date',
      width: 120,
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openViewDialog(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditDialog(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteEmployee(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>Employee Management</h2>
          <p style={{ color: '#666', marginTop: 4 }}>Manage your workforce efficiently</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
        >
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={employees.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active"
              value={employees.filter((e) => e.status === 'active').length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="On Leave"
              value={employees.filter((e) => e.status === 'on-leave').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Departments"
              value={departments.length}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search employees..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                size="large"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
                size="large"
                placeholder="Filter by status"
              >
                <Select.Option value="all">All Statuses</Select.Option>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="on-leave">On Leave</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
                <Select.Option value="terminated">Terminated</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                value={departmentFilter}
                onChange={setDepartmentFilter}
                size="large"
                placeholder="Filter by department"
              >
                <Select.Option value="all">All Departments</Select.Option>
                {departments.map((dept) => (
                  <Select.Option key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button
                icon={<DownloadOutlined />}
                size="large"
                style={{ width: '100%' }}
              >
                Export
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Employee Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredEmployees}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="No employees found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  Add Employee
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Add Employee Modal - Redesigned with Ant Design */}
      < Modal
        title={
          < div style={{ fontSize: '20px', fontWeight: 600, color: '#1e40af' }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Add New Employee
          </div >
        }
        open={showAddDialog}
        onCancel={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        onOk={handleAddEmployee}
        width={900}
        okText="Add Employee"
        cancelText="Cancel"
        okButtonProps={{ size: 'large', icon: <PlusOutlined /> }}
        cancelButtonProps={{ size: 'large' }}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 24 }
        }}
      >
        <Tabs
          defaultActiveKey="personal"
          type="card"
          items={[
            {
              key: 'personal',
              label: (
                <span>
                  <UserOutlined style={{ marginRight: 4 }} />
                  Personal Info
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Form layout="vertical">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>First Name <span style={{ color: '#ef4444' }}>*</span></span>}
                        required
                      >
                        <Input
                          size="large"
                          prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                          placeholder="Enter first name"
                          value={formData.first_name}
                          onChange={(e: any) => setFormData({ ...formData, first_name: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>Last Name <span style={{ color: '#ef4444' }}>*</span></span>}
                        required
                      >
                        <Input
                          size="large"
                          prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                          placeholder="Enter last name"
                          value={formData.last_name}
                          onChange={(e: any) => setFormData({ ...formData, last_name: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>Email <span style={{ color: '#ef4444' }}>*</span></span>}
                        required
                      >
                        <Input
                          size="large"
                          type="email"
                          prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                          placeholder="employee@company.com"
                          value={formData.email}
                          onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Phone Number</span>}>
                        <Input
                          size="large"
                          prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone}
                          onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Date of Birth</span>}>
                        <DatePicker
                          size="large"
                          style={{ width: '100%' }}
                          placeholder="Select date"
                          value={formData.date_of_birth ? dayjs(formData.date_of_birth) : null}
                          onChange={(date) => setFormData({ ...formData, date_of_birth: date ? date.format('YYYY-MM-DD') : '' })}
                          format="YYYY-MM-DD"
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Gender</span>}>
                        <Select
                          size="large"
                          placeholder="Select gender"
                          value={formData.gender || undefined}
                          onChange={(value: any) => setFormData({ ...formData, gender: value })}
                        >
                          <Select.Option value="male">Male</Select.Option>
                          <Select.Option value="female">Female</Select.Option>
                          <Select.Option value="other">Other</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: 'employment',
              label: (
                <span>
                  <IdcardOutlined style={{ marginRight: 4 }} />
                  Employment
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Form layout="vertical">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>Position <span style={{ color: '#ef4444' }}>*</span></span>}
                        required
                      >
                        <Input
                          size="large"
                          prefix={<IdcardOutlined style={{ color: '#9ca3af' }} />}
                          placeholder="e.g., Software Engineer"
                          value={formData.position}
                          onChange={(e: any) => setFormData({ ...formData, position: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Department</span>}>
                        <Select
                          size="large"
                          placeholder={departments.length > 0 ? "Select department" : "No departments available"}
                          value={formData.department_id || undefined}
                          onChange={(value: any) => setFormData({ ...formData, department_id: value })}
                        >
                          {departments.map((dept) => (
                            <Select.Option key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </Select.Option>
                          ))}
                        </Select>
                        {departments.length === 0 && (
                          <div style={{ color: '#f59e0b', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ExclamationCircleOutlined style={{ width: 12, height: 12 }} />
                            Please create departments first
                          </div>
                        )}
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Employment Type</span>}>
                        <Select
                          size="large"
                          value={formData.employment_type}
                          onChange={(value: any) => setFormData({ ...formData, employment_type: value })}
                        >
                          <Select.Option value="full-time">Full-time</Select.Option>
                          <Select.Option value="part-time">Part-time</Select.Option>
                          <Select.Option value="contract">Contract</Select.Option>
                          <Select.Option value="intern">Intern</Select.Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>Join Date <span style={{ color: '#ef4444' }}>*</span></span>}
                        required
                      >
                        <DatePicker
                          size="large"
                          style={{ width: '100%' }}
                          placeholder="Select join date"
                          value={formData.join_date ? dayjs(formData.join_date) : null}
                          onChange={(date) => setFormData({ ...formData, join_date: date ? date.format('YYYY-MM-DD') : '' })}
                          format="YYYY-MM-DD"
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Base Salary (USD)</span>}>
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          prefix={<DollarOutlined />}
                          placeholder="50000"
                          min={0}
                          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                          value={formData.base_salary ? parseFloat(formData.base_salary) : undefined}
                          onChange={(value: any) => setFormData({ ...formData, base_salary: value?.toString() || '' })}
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Status</span>}>
                        <Select
                          size="large"
                          value={formData.status}
                          onChange={(value: any) => setFormData({ ...formData, status: value })}
                        >
                          <Select.Option value="active">
                            <span style={{ color: '#10b981' }}>● Active</span>
                          </Select.Option>
                          <Select.Option value="on-leave">
                            <span style={{ color: '#f59e0b' }}>● On Leave</span>
                          </Select.Option>
                          <Select.Option value="inactive">
                            <span style={{ color: '#6b7280' }}>● Inactive</span>
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: 'address',
              label: (
                <span>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  Address & Contact
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Form layout="vertical">
                    <Divider orientationMargin={0} style={{ margin: '0 0 16px 0' }}>Address Information</Divider>
                    <Form.Item label={<span style={{ fontWeight: 500 }}>Street Address</span>}>
                      <Input
                        size="large"
                        prefix={<EnvironmentOutlined style={{ color: '#9ca3af' }} />}
                        placeholder="123 Main Street, Apt 4B"
                        value={formData.address}
                        onChange={(e: any) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>City</span>}>
                        <Input
                          size="large"
                          placeholder="San Francisco"
                          value={formData.city}
                          onChange={(e: any) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>State</span>}>
                        <Input
                          size="large"
                          placeholder="CA"
                          value={formData.state}
                          onChange={(e: any) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Zip Code</span>}>
                        <Input
                          size="large"
                          placeholder="94102"
                          value={formData.zip_code}
                          onChange={(e: any) => setFormData({ ...formData, zip_code: e.target.value })}
                        />
                      </Form.Item>
                    </div>

                    <Divider orientationMargin={0} style={{ margin: '24px 0 16px 0' }}>Emergency Contact</Divider>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Contact Name</span>}>
                        <Input
                          size="large"
                          prefix={<ContactsOutlined style={{ color: '#9ca3af' }} />}
                          placeholder="John Doe"
                          value={formData.emergency_contact_name}
                          onChange={(e: any) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        />
                      </Form.Item>

                      <Form.Item label={<span style={{ fontWeight: 500 }}>Contact Phone</span>}>
                        <Input
                          size="large"
                          prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                          placeholder="+1 (555) 987-6543"
                          value={formData.emergency_contact_phone}
                          onChange={(e: any) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        />
                      </Form.Item>
                    </div>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Modal >

      {/* Edit Employee Modal */}
      <Modal
        title={
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#1e40af' }}>
            <EditOutlined style={{ marginRight: 8 }} />
            Edit Employee
          </div>
        }
        open={showEditDialog}
        onCancel={() => {
          setShowEditDialog(false);
          setSelectedEmployee(null);
          resetForm();
        }}
        onOk={handleEditEmployee}
        width={900}
        okText="Update Employee"
        cancelText="Cancel"
        okButtonProps={{ size: 'large' }}
        cancelButtonProps={{ size: 'large' }}
      >
        <Form layout="vertical" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" required>
                <Input
                  size="large"
                  value={formData.first_name}
                  onChange={(e: any) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" required>
                <Input
                  size="large"
                  value={formData.last_name}
                  onChange={(e: any) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" required>
                <Input
                  size="large"
                  type="email"
                  value={formData.email}
                  onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone">
                <Input
                  size="large"
                  value={formData.phone}
                  onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Position" required>
                <Input
                  size="large"
                  value={formData.position}
                  onChange={(e: any) => setFormData({ ...formData, position: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Department">
                <Select
                  size="large"
                  value={formData.department_id}
                  onChange={(value: any) => setFormData({ ...formData, department_id: value })}
                >
                  {departments.map((dept) => (
                    <Select.Option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Employment Type">
                <Select
                  size="large"
                  value={formData.employment_type}
                  onChange={(value: any) => setFormData({ ...formData, employment_type: value })}
                >
                  <Select.Option value="full-time">Full-time</Select.Option>
                  <Select.Option value="part-time">Part-time</Select.Option>
                  <Select.Option value="contract">Contract</Select.Option>
                  <Select.Option value="intern">Intern</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Status">
                <Select
                  size="large"
                  value={formData.status}
                  onChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="on-leave">On Leave</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                  <Select.Option value="terminated">Terminated</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* View Employee Modal */}
      <Modal
        title={
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#1e40af' }}>
            <EyeOutlined style={{ marginRight: 8 }} />
            Employee Details
          </div>
        }
        open={showViewDialog}
        onCancel={() => setShowViewDialog(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowViewDialog(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedEmployee && (
          <div>
            <Card style={{ marginBottom: 24, background: 'linear-gradient(to right, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  <p style={{ color: '#2563eb', fontWeight: 500, marginTop: 4, marginBottom: 0 }}>
                    {selectedEmployee.position}
                  </p>
                </div>
                {getStatusTag(selectedEmployee.status)}
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Employee ID</p>
                  <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 0 }}>{selectedEmployee.employee_id}</p>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Department</p>
                  <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 0 }}>
                    {selectedEmployee.department_name || 'N/A'}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Email</p>
                  <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 0 }}>{selectedEmployee.email}</p>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Phone</p>
                  <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 0 }}>{selectedEmployee.phone || 'N/A'}</p>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Employment Type</p>
                  <p style={{ fontWeight: 600, color: '#1e40af', textTransform: 'capitalize', marginBottom: 0 }}>
                    {selectedEmployee.employment_type || 'N/A'}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Join Date</p>
                  <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 0 }}>{selectedEmployee.join_date || 'N/A'}</p>
                </div>
              </Col>
              {selectedEmployee.base_salary && (
                <Col span={12}>
                  <div>
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Base Salary</p>
                    <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 0 }}>
                      ${selectedEmployee.base_salary.toLocaleString()}
                    </p>
                  </div>
                </Col>
              )}
              {selectedEmployee.emergency_contact_name && (
                <Col span={24}>
                  <div>
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Emergency Contact</p>
                    <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 0 }}>
                      {selectedEmployee.emergency_contact_name}
                      {selectedEmployee.emergency_contact_phone && ` - ${selectedEmployee.emergency_contact_phone}`}
                    </p>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div >
  );
}
