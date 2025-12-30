import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Input,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Tooltip,
  Empty,
  Alert
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DollarOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  ReloadOutlined,
  TeamOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department_name: string;
  position: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  tax: number;
  net_salary: number;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at: string;
}

interface PayrollStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  paid: number;
  cancelled: number;
  total_base_salary: number;
  total_bonuses: number;
  total_deductions: number;
  total_tax: number;
  total_net_salary: number;
}

export default function PayrollManagementDynamic() {
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchPayroll();
    fetchStats();
    fetchEmployees();
  }, [filterStatus]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/payroll?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data: any[] };

      if (data.success) {
        setPayrollRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/payroll?stats=true', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data: any };

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data: any[] };

      if (data.success) {
        setEmployees(data.data.filter((emp: any) => emp.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddPayroll = async (values: any) => {
    try {
      const formData = {
        ...values,
        pay_period_start: values.pay_period_start ? dayjs(values.pay_period_start).format('YYYY-MM-DD') : '',
        pay_period_end: values.pay_period_end ? dayjs(values.pay_period_end).format('YYYY-MM-DD') : '',
        pay_date: values.pay_date ? dayjs(values.pay_date).format('YYYY-MM-DD') : '',
      };

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        message.success('Payroll record created successfully');
        setShowAddModal(false);
        form.resetFields();
        fetchPayroll();
        fetchStats();
      } else {
        message.error(data.error || 'Failed to create payroll record');
      }
    } catch (error) {
      console.error('Error creating payroll:', error);
      message.error('Failed to create payroll record');
    }
  };

  const handleBulkGenerate = async (values: any) => {
    try {
      const formData = {
        pay_period_start: values.pay_period_start ? dayjs(values.pay_period_start).format('YYYY-MM-DD') : '',
        pay_period_end: values.pay_period_end ? dayjs(values.pay_period_end).format('YYYY-MM-DD') : '',
        pay_date: values.pay_date ? dayjs(values.pay_date).format('YYYY-MM-DD') : '',
        action: 'generate_bulk'
      };

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json() as { success: boolean; message?: string; error?: string };

      if (data.success) {
        message.success(data.message || 'Payroll records generated successfully');
        setShowBulkModal(false);
        bulkForm.resetFields();
        fetchPayroll();
        fetchStats();
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to generate bulk payroll',
        });
      }
    } catch (error) {
      console.error('Error generating bulk payroll:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to generate bulk payroll',
      });
    }
  };

  const handleUpdatePayroll = async (formData: any) => {
    if (!selectedRecord) return;

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/payroll/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        fetchPayroll();
        fetchStats();
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to update payroll record',
        });
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to update payroll record',
      });
    }
  };

  const handleDeletePayroll = async (id: number) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this payroll record?',
      okText: 'Yes, Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const sessionToken = localStorage.getItem('sessionToken');
          const response = await fetch('/api/payroll', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ id })
          });

          const data = await response.json() as { success: boolean; error?: string };

          if (data.success) {
            fetchPayroll();
            fetchStats();
          } else {
            Modal.error({
              title: 'Error',
              content: data.error || 'Failed to delete payroll record',
            });
          }
        } catch (error) {
          console.error('Error deleting payroll:', error);
          Modal.error({
            title: 'Error',
            content: 'Failed to delete payroll record',
          });
        }
      },
    });
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        fetchPayroll();
        fetchStats();
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to update status',
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to update status',
      });
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      paid: { color: 'success', icon: <CheckOutlined /> },
      approved: { color: 'processing', icon: <CheckOutlined /> },
      pending: { color: 'warning', icon: <CalendarOutlined /> },
      draft: { color: 'default', icon: <EditOutlined /> },
      cancelled: { color: 'error', icon: <CloseOutlined /> },
    };

    const { color, icon } = config[status] || config.draft;
    return (
      <Tag color={color} icon={icon}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Tag>
    );
  };

  const columns: ColumnsType<PayrollRecord> = [
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text: string, record: PayrollRecord) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <span style={{ fontWeight: 500 }}>{text}</span>
          </Space>
          <span style={{ fontSize: '12px', color: '#888' }}>{record.employee_code}</span>
        </Space>
      ),
      sorter: (a, b) => a.employee_name.localeCompare(b.employee_name),
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      ellipsis: true,
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Pay Period',
      key: 'pay_period',
      render: (_, record: PayrollRecord) => (
        <Space direction="vertical" size={0}>
          <span>{dayjs(record.pay_period_start).format('MMM DD, YYYY')}</span>
          <span style={{ fontSize: '12px', color: '#888' }}>
            to {dayjs(record.pay_period_end).format('MMM DD, YYYY')}
          </span>
        </Space>
      ),
    },
    {
      title: 'Base Salary',
      dataIndex: 'base_salary',
      key: 'base_salary',
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
      sorter: (a, b) => a.base_salary - b.base_salary,
    },
    {
      title: 'Bonuses',
      dataIndex: 'bonuses',
      key: 'bonuses',
      align: 'right',
      render: (amount: number) => (
        <span style={{ color: '#52c41a' }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      align: 'right',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f' }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Tax',
      dataIndex: 'tax',
      key: 'tax',
      align: 'right',
      render: (amount: number) => (
        <span style={{ color: '#fa8c16' }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Net Salary',
      dataIndex: 'net_salary',
      key: 'net_salary',
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold' }}>{formatCurrency(amount)}</span>
      ),
      sorter: (a, b) => a.net_salary - b.net_salary,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Paid', value: 'paid' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record: PayrollRecord) => (
        <Space>
          {record.status === 'draft' && (
            <Tooltip title="Submit">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined style={{ color: '#faad14' }} />}
                onClick={() => handleStatusChange(record.id, 'pending')}
              />
            </Tooltip>
          )}
          {record.status === 'pending' && (
            <Tooltip title="Approve">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined style={{ color: '#1890ff' }} />}
                onClick={() => handleStatusChange(record.id, 'approved')}
              />
            </Tooltip>
          )}
          {record.status === 'approved' && (
            <Tooltip title="Mark as Paid">
              <Button
                type="text"
                size="small"
                icon={<DollarOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleStatusChange(record.id, 'paid')}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedRecord(record);
                setShowEditModal(true);
              }}
            />
          </Tooltip>
          {record.status !== 'paid' && (
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeletePayroll(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filteredRecords = payrollRecords.filter(record =>
    record.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Payroll Management</h1>
              <p style={{ color: '#888', margin: '4px 0 0 0' }}>Manage employee payroll and compensation</p>
            </div>
            <Space>
              <Button
                icon={<TeamOutlined />}
                onClick={() => setShowBulkModal(true)}
              >
                Bulk Generate
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddModal(true)}
              >
                Add Payroll
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Statistics */}
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Total Records"
                value={stats.total}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Draft"
                value={stats.draft}
                prefix={<EditOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending}
                prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Approved"
                value={stats.approved}
                prefix={<CheckOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Paid"
                value={stats.paid}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Total Payroll"
                value={formatCurrency(stats.total_net_salary || 0)}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ fontSize: '18px' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters and Actions */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Statuses"
              value={filterStatus || undefined}
              onChange={setFilterStatus}
              allowClear
            >
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Search by name or employee ID..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchPayroll();
                  fetchStats();
                }}
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Payroll Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No payroll records found"
              />
            ),
          }}
        />
      </Card>

      {/* Add/Edit Payroll Modal */}
      <Modal
        title={selectedRecord ? 'Edit Payroll Record' : 'Add Payroll Record'}
        open={showAddModal || showEditModal}
        onCancel={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedRecord(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedRecord ? handleUpdatePayroll : handleAddPayroll}
          initialValues={selectedRecord ? {
            ...selectedRecord,
            pay_period_start: selectedRecord.pay_period_start ? dayjs(selectedRecord.pay_period_start) : null,
            pay_period_end: selectedRecord.pay_period_end ? dayjs(selectedRecord.pay_period_end) : null,
            pay_date: selectedRecord.pay_date ? dayjs(selectedRecord.pay_date) : null,
          } : {
            status: 'draft'
          }}
        >
          {!selectedRecord && (
            <Form.Item
              label="Employee"
              name="employee_id"
              rules={[{ required: true, message: 'Please select an employee' }]}
            >
              <Select
                showSearch
                placeholder="Select Employee"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={employees.map((emp: any) => ({
                  value: emp.id,
                  label: `${emp.first_name} ${emp.last_name} (${emp.employee_id}) - $${emp.base_salary}/month`
                }))}
                onChange={(value) => {
                  const emp = employees.find((e: any) => e.id === value);
                  if (emp) {
                    form.setFieldsValue({
                      base_salary: emp.base_salary,
                      tax: emp.base_salary * 0.1
                    });
                  }
                }}
              />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Pay Period Start"
                name="pay_period_start"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Pay Period End"
                name="pay_period_end"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Pay Date"
                name="pay_date"
                rules={[{ required: true, message: 'Please select pay date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Base Salary" name="base_salary">
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="₹"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Bonuses" name="bonuses">
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="₹"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Deductions" name="deductions">
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="₹"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tax" name="tax">
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="₹"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Status" name="status">
                <Select>
                  <Select.Option value="draft">Draft</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="approved">Approved</Select.Option>
                  <Select.Option value="paid">Paid</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Payment Method" name="payment_method">
                <Input placeholder="e.g., Bank Transfer, Check" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Generate Modal */}
      <Modal
        title="Bulk Generate Payroll"
        open={showBulkModal}
        onCancel={() => {
          setShowBulkModal(false);
          bulkForm.resetFields();
        }}
        onOk={() => bulkForm.submit()}
        width={500}
      >
        <Alert
          message="This will create draft payroll records for all active employees based on their current base salary."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkGenerate}
        >
          <Form.Item
            label="Pay Period Start"
            name="pay_period_start"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Pay Period End"
            name="pay_period_end"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Pay Date"
            name="pay_date"
            rules={[{ required: true, message: 'Please select pay date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
