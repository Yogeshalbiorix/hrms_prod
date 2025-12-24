import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, DatePicker, Select, Statistic, Row, Col, Modal, Form, Input, message, Tooltip, Empty, Descriptions } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface LeaveRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department_name: string;
  leave_type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'unpaid' | 'emergency' | 'birthday' | 'anniversary';
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approval_date?: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export default function LeaveManagement() {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LeaveRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLeaveType, setFilterLeaveType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { RangePicker } = DatePicker;

  useEffect(() => {
    fetchLeaves();
    fetchStats();
    fetchEmployees();
  }, [filterStatus, filterLeaveType]);

  // Populate form when editing a record
  useEffect(() => {
    if (selectedRecord && showEditModal) {
      form.setFieldsValue({
        employee_id: selectedRecord.employee_id,
        leave_type: selectedRecord.leave_type,
        start_date: selectedRecord.start_date ? dayjs(selectedRecord.start_date) : null,
        end_date: selectedRecord.end_date ? dayjs(selectedRecord.end_date) : null,
        reason: selectedRecord.reason,
        notes: selectedRecord.notes,
        status: selectedRecord.status
      });
    } else if (showAddModal) {
      form.resetFields();
    }
  }, [selectedRecord, showEditModal, showAddModal, form]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterLeaveType) params.append('leave_type', filterLeaveType);

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/leaves?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as any;

      if (data.success) {
        setLeaveRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/leaves?stats=true', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as any;

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
      const data = await response.json() as any;

      if (data.success) {
        // Filter out terminated employees from leave management
        const activeEmployees = data.data.filter((emp: any) => emp.status !== 'terminated');
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddLeave = async (formData: any) => {
    try {
      // Format dates properly
      const formattedData = {
        ...formData,
        start_date: formData.start_date ? dayjs(formData.start_date).format('YYYY-MM-DD') : undefined,
        end_date: formData.end_date ? dayjs(formData.end_date).format('YYYY-MM-DD') : undefined
      };

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formattedData)
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Leave request created successfully');
        form.resetFields();
        setShowAddModal(false);
        fetchLeaves();
        fetchStats();
      } else {
        message.error(data.error || 'Failed to create leave request');
      }
    } catch (error) {
      console.error('Error creating leave:', error);
      message.error('Failed to create leave request');
    }
  };

  const handleUpdateLeave = async (formData: any) => {
    if (!selectedRecord) return;

    try {
      // Format dates properly
      const formattedData = {
        ...formData,
        start_date: formData.start_date ? dayjs(formData.start_date).format('YYYY-MM-DD') : undefined,
        end_date: formData.end_date ? dayjs(formData.end_date).format('YYYY-MM-DD') : undefined
      };

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/leaves/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formattedData)
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Leave request updated successfully');
        form.resetFields();
        setShowEditModal(false);
        setSelectedRecord(null);
        fetchLeaves();
        fetchStats();
      } else {
        message.error(data.error || 'Failed to update leave request');
      }
    } catch (error) {
      console.error('Error updating leave:', error);
      message.error('Failed to update leave request');
    }
  };

  const handleDeleteLeave = async (id: number) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this leave request?',
      okText: 'Yes, Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const sessionToken = localStorage.getItem('sessionToken');
          const response = await fetch('/api/leaves', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ id })
          });

          const data = await response.json() as any;

          if (data.success) {
            message.success('Leave request deleted successfully');
            fetchLeaves();
            fetchStats();
          } else {
            message.error(data.error || 'Failed to delete leave request');
          }
        } catch (error) {
          console.error('Error deleting leave:', error);
          Modal.error({
            title: 'Error',
            content: 'Failed to delete leave request',
          });
        }
      },
    });
  };

  const handleApprove = async (id: number) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          status: 'approved',
          approval_date: new Date().toISOString(),
          approved_by: 'Current User'
        })
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Leave request approved successfully');
        fetchLeaves();
        fetchStats();
      } else {
        message.error(data.error || 'Failed to approve leave');
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      message.error('Failed to approve leave status');
    }
  };

  const showRejectModal = (record: LeaveRecord) => {
    setRejectingLeave(record);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectingLeave) return;

    if (!rejectionReason.trim()) {
      message.error('Please provide a reason for rejection');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      message.error('Rejection reason must be at least 10 characters long');
      return;
    }

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/leaves/${rejectingLeave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          status: 'rejected',
          approval_date: new Date().toISOString(),
          approved_by: 'Current User',
          rejection_reason: rejectionReason,
          notes: rejectionReason
        })
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Leave request rejected successfully');
        setRejectModalVisible(false);
        setRejectingLeave(null);
        setRejectionReason('');
        fetchLeaves();
        fetchStats();
      } else {
        message.error(data.error || 'Failed to reject leave');
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      message.error('Failed to reject leave');
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      approved: { color: 'success', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', icon: <CloseCircleOutlined /> },
      pending: { color: 'warning', icon: <ClockCircleOutlined /> },
      cancelled: { color: 'default', icon: <CloseCircleOutlined /> }
    };
    const { color, icon } = config[status] || config['pending'];
    return (
      <Tag color={color} icon={icon}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  interface LeaveRecord {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_code: string;
    department_name: string;
    leave_type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'unpaid' | 'emergency' | 'birthday' | 'anniversary' | 'comp_off' | 'overseas';
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    rejection_reason?: string;
    approval_date?: string;
    approved_by?: string;
    created_at: string;
    updated_at: string;
  }

  const getLeaveTypeTag = (type: string) => {
    const colors: Record<string, string> = {
      sick: 'red',
      vacation: 'blue',
      personal: 'purple',
      maternity: 'magenta',
      paternity: 'cyan',
      unpaid: 'orange',
      emergency: 'volcano',
      birthday: 'purple',
      anniversary: 'pink',
      comp_off: 'geekblue',
      overseas: 'gold'
    };
    return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
  };

  const columns: ColumnsType<LeaveRecord> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1890ff' }}>
            <UserOutlined style={{ marginRight: 6 }} />
            {record.employee_name}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employee_code}</div>
        </div>
      ),
      sorter: (a, b) => a.employee_name.localeCompare(b.employee_name),
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      width: 120,
      render: (type: string) => getLeaveTypeTag(type),
      filters: [
        { text: 'Sick', value: 'sick' },
        { text: 'Vacation', value: 'vacation' },
        { text: 'Personal', value: 'personal' },
        { text: 'Maternity', value: 'maternity' },
        { text: 'Paternity', value: 'paternity' },
        { text: 'Unpaid', value: 'unpaid' },
        { text: 'Emergency', value: 'emergency' },
        { text: 'Birthday', value: 'birthday' },
        { text: 'Anniversary', value: 'anniversary' },
      ],
      onFilter: (value, record) => record.leave_type === value,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Days',
      dataIndex: 'total_days',
      key: 'total_days',
      width: 80,
      align: 'center' as const,
      render: (days: number) => <Tag color="blue">{days}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: true,
      render: (reason: string) => reason || '-',
    },
    {
      title: 'Rejection Reason',
      dataIndex: 'rejection_reason',
      key: 'rejection_reason',
      width: 200,
      ellipsis: true,
      render: (reason: string, record) => (
        record.status === 'rejected' && reason ? (
          <Tooltip title={reason}>
            <span style={{ color: '#ff4d4f' }}>
              <FileTextOutlined style={{ marginRight: 4 }} />
              {reason}
            </span>
          </Tooltip>
        ) : record.status === 'rejected' && !reason ? (
          <span style={{ color: '#999' }}>No reason provided</span>
        ) : null
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  style={{ color: '#52c41a' }}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApprove(record.id)}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => showRejectModal(record)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedRecord(record);
                setShowEditModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteLeave(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredRecords = leaveRecords.filter(record =>
    record.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6} lg={4} xl={4}>
          <Card>
            <Statistic
              title="Total"
              value={stats?.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5} xl={5}>
          <Card>
            <Statistic
              title="Pending"
              value={stats?.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5} xl={5}>
          <Card>
            <Statistic
              title="Approved"
              value={stats?.approved || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5} xl={5}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats?.rejected || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5} xl={5}>
          <Card>
            <Statistic
              title="Cancelled"
              value={stats?.cancelled || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Statuses"
              value={filterStatus || undefined}
              onChange={setFilterStatus}
              allowClear
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Leave Types"
              value={filterLeaveType || undefined}
              onChange={setFilterLeaveType}
              allowClear
            >
              <Select.Option value="sick">Sick Leave</Select.Option>
              <Select.Option value="vacation">Vacation</Select.Option>
              <Select.Option value="personal">Personal</Select.Option>
              <Select.Option value="maternity">Maternity</Select.Option>
              <Select.Option value="paternity">Paternity</Select.Option>
              <Select.Option value="unpaid">Unpaid</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by name or employee ID..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddModal(true)}
              >
                New Leave
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchLeaves();
                  fetchStats();
                }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Leave Requests Table */}
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
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <p>No leave requests found</p>
                    {leaveRecords.length === 0 && !loading && (
                      <Button
                        type="primary"
                        style={{ marginTop: 16 }}
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
                              fetchLeaves();
                              fetchStats();
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
                    )}
                  </div>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Add/Edit Leave Modal */}
      <Modal
        title={selectedRecord ? 'Edit Leave Request' : 'New Leave Request'}
        open={showAddModal || showEditModal}
        onCancel={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedRecord(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedRecord ? handleUpdateLeave : handleAddLeave}
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
                  label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})`
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Leave Type"
            name="leave_type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select>
              <Select.Option value="sick">Sick Leave</Select.Option>
              <Select.Option value="vacation">Vacation</Select.Option>
              <Select.Option value="personal">Personal</Select.Option>
              <Select.Option value="maternity">Maternity</Select.Option>
              <Select.Option value="paternity">Paternity</Select.Option>
              <Select.Option value="unpaid">Unpaid</Select.Option>
              <Select.Option value="emergency">Emergency</Select.Option>
              <Select.Option value="birthday">Birthday</Select.Option>
              <Select.Option value="anniversary">Anniversary</Select.Option>
              <Select.Option value="comp_off">Comp Off</Select.Option>
              <Select.Option value="overseas">Overseas</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Start Date"
                name="start_date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="End Date"
                name="end_date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          {selectedRecord && (
            <Form.Item label="Status" name="status">
              <Select>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
                <Select.Option value="cancelled">Cancelled</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Reason" name="reason">
            <Input.TextArea rows={3} placeholder="Reason for leave..." />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Reject Leave Request</span>
          </Space>
        }
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectingLeave(null);
          setRejectionReason('');
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        width={600}
      >
        {rejectingLeave && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Employee">
                  {rejectingLeave.employee_name}
                </Descriptions.Item>
                <Descriptions.Item label="Employee ID">
                  {rejectingLeave.employee_code}
                </Descriptions.Item>
                <Descriptions.Item label="Leave Type">
                  {getLeaveTypeTag(rejectingLeave.leave_type)}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {rejectingLeave.total_days} days
                </Descriptions.Item>
                <Descriptions.Item label="From - To" span={2}>
                  {dayjs(rejectingLeave.start_date).format('MMM DD, YYYY')} - {dayjs(rejectingLeave.end_date).format('MMM DD, YYYY')}
                </Descriptions.Item>
                {rejectingLeave.reason && (
                  <Descriptions.Item label="Employee Reason" span={2}>
                    {rejectingLeave.reason}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 500, color: '#ff4d4f' }}>
                Rejection Reason <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <span style={{ fontSize: '12px', color: '#999', marginLeft: 8 }}>
                (Minimum 10 characters)
              </span>
            </div>
            <Input.TextArea
              rows={5}
              placeholder="Please provide a clear and detailed reason for rejecting this leave request. For example:
- Insufficient staffing during requested period
- Leave quota exceeded
- Documentation not provided
- Business critical period
This will be sent to the employee via email notification."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              maxLength={500}
              showCount
              status={rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 ? 'error' : ''}
            />
            {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
              <div style={{ marginTop: 4, color: '#ff4d4f', fontSize: '12px' }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                Please provide at least 10 characters for rejection reason
              </div>
            )}
            <div style={{ marginTop: 8, color: '#1890ff', fontSize: '12px' }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              The employee will receive an email notification with your rejection reason.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
