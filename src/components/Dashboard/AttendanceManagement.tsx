import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, DatePicker, Select, Statistic, Row, Col, Modal, Form, Input, message, Tooltip, Empty, Typography } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  DownloadOutlined,
  BankOutlined,
  HomeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department_name: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  working_hours?: string;
  work_mode?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  notes?: string;
  location?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  on_leave: number;
}

export default function AttendanceManagement() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [filterDate, setFilterDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAttendance();
    fetchStats();
    fetchEmployees();
  }, [filterDate, filterStatus]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterStatus) params.append('status', filterStatus);

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/attendance?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data: any[] };

      if (data.success) {
        setAttendanceRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({ stats: 'true' });
      if (filterDate) params.append('date', filterDate);

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/attendance?${params}`, {
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
        // Filter out terminated employees from attendance management
        const activeEmployees = data.data.filter((emp: any) => emp.status !== 'terminated');
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddAttendance = async (formData: any) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json() as any;

      if (data.success) {
        setShowAddModal(false);
        fetchAttendance();
        fetchStats();
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to add attendance',
        });
      }
    } catch (error) {
      console.error('Error adding attendance:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to add attendance',
      });
    }
  };

  const handleUpdateAttendance = async (formData: any) => {
    if (!selectedRecord) return;

    try {
      const sessionToken = localStorage.getItem('sessionToken');

      // Map form fields to database fields
      const updateData = {
        clock_in: formData.check_in_time,
        clock_out: formData.check_out_time,
        working_hours: formData.working_hours,
        work_mode: formData.work_mode,
        status: formData.status,
        notes: formData.notes
      };

      const response = await fetch(`/api/attendance/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Attendance updated successfully!');
        setShowEditModal(false);
        setSelectedRecord(null);
        form.resetFields();
        fetchAttendance();
        fetchStats();
      } else {
        message.error(data.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      message.error('Failed to update attendance');
    }
  };

  const handleDeleteAttendance = async (id: number) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this attendance record?',
      okText: 'Yes, Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const sessionToken = localStorage.getItem('sessionToken');
          const response = await fetch('/api/attendance', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ id })
          });

          const data = await response.json() as any;

          if (data.success) {
            fetchAttendance();
            fetchStats();
          } else {
            Modal.error({
              title: 'Error',
              content: data.error || 'Failed to delete attendance',
            });
          }
        } catch (error) {
          console.error('Error deleting attendance:', error);
          Modal.error({
            title: 'Error',
            content: 'Failed to delete attendance',
          });
        }
      },
    });
  };



  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      present: { color: 'success', icon: <CheckCircleOutlined /> },
      absent: { color: 'error', icon: <CloseCircleOutlined /> },
      late: { color: 'warning', icon: <WarningOutlined /> },
      'half-day': { color: 'processing', icon: <ClockCircleOutlined /> },
      'on-leave': { color: 'default', icon: <CalendarOutlined /> }
    };
    const { color, icon } = config[status] || config['present'];
    return (
      <Tag color={color} icon={icon}>
        {status.toUpperCase().replace('-', ' ')}
      </Tag>
    );
  };

  const columns: ColumnsType<AttendanceRecord> = [
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
      title: 'Date',
      dataIndex: 'attendance_date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => new Date(a.attendance_date).getTime() - new Date(b.attendance_date).getTime(),
    },
    {
      title: 'Check In',
      dataIndex: 'check_in_time',
      key: 'check_in',
      width: 100,
      render: (time: string) => time ? (
        <Tag icon={<ClockCircleOutlined />} color="blue">{time}</Tag>
      ) : '-',
    },
    {
      title: 'Check Out',
      dataIndex: 'check_out_time',
      key: 'check_out',
      width: 100,
      render: (time: string) => time ? (
        <Tag icon={<ClockCircleOutlined />} color="orange">{time}</Tag>
      ) : <Tag color="processing">Active</Tag>,
    },
    {
      title: 'Working Hours',
      dataIndex: 'working_hours',
      key: 'working_hours',
      width: 120,
      render: (hours: string) => hours ? (
        <Tag color="cyan">{hours}</Tag>
      ) : '-',
    },
    {
      title: 'Work Mode',
      dataIndex: 'work_mode',
      key: 'work_mode',
      width: 100,
      render: (mode: string) => {
        if (mode === 'office') return <Tag color="blue">Office</Tag>;
        if (mode === 'wfh') return <Tag color="green">WFH</Tag>;
        return '-';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Present', value: 'present' },
        { text: 'Absent', value: 'absent' },
        { text: 'Late', value: 'late' },
        { text: 'Half Day', value: 'half-day' },
        { text: 'On Leave', value: 'on-leave' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedRecord(record);
                form.setFieldsValue({
                  attendance_date: record.attendance_date ? dayjs(record.attendance_date) : null,
                  check_in_time: record.check_in_time || '',
                  check_out_time: record.check_out_time || '',
                  working_hours: record.working_hours || '',
                  work_mode: record.work_mode || 'office',
                  status: record.status || 'present',
                  notes: record.notes || ''
                });
                setShowEditModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAttendance(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredRecords = attendanceRecords.filter(record =>
    record.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total"
              value={stats?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Present"
              value={stats?.present || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Absent"
              value={stats?.absent || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Late"
              value={stats?.late || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Half Day"
              value={stats?.half_day || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="On Leave"
              value={stats?.on_leave || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Select Date"
              value={filterDate ? dayjs(filterDate) : null}
              onChange={(date) => setFilterDate(date ? date.format('YYYY-MM-DD') : '')}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Statuses"
              value={filterStatus || undefined}
              onChange={setFilterStatus}
              allowClear
            >
              <Select.Option value="present">Present</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
              <Select.Option value="late">Late</Select.Option>
              <Select.Option value="half-day">Half Day</Select.Option>
              <Select.Option value="on-leave">On Leave</Select.Option>
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
                Mark Attendance
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchAttendance();
                  fetchStats();
                }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Attendance Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No attendance records found"
              />
            ),
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          selectedRecord ? (
            <Space>
              <EditOutlined style={{ color: '#1890ff' }} />
              <span>Edit Attendance Record</span>
            </Space>
          ) : (
            <Space>
              <PlusOutlined style={{ color: '#52c41a' }} />
              <span>Mark Attendance</span>
            </Space>
          )
        }
        open={showAddModal || showEditModal}
        onCancel={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedRecord(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={selectedRecord ? 'Update' : 'Mark'}
        okButtonProps={{ icon: selectedRecord ? <EditOutlined /> : <PlusOutlined /> }}
        width={700}
      >
        {selectedRecord && (
          <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
            <Space direction="vertical" size="small">
              <Text strong style={{ color: '#1890ff' }}>
                <UserOutlined /> {selectedRecord.employee_name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Employee ID: {selectedRecord.employee_code} | Department: {selectedRecord.department_name}
              </Text>
            </Space>
          </Card>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedRecord ? handleUpdateAttendance : handleAddAttendance}
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
                  label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})`,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item
            label="Date"
            name="attendance_date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabled={!!selectedRecord}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Check In Time"
                name="check_in_time"
                tooltip="Format: HH:MM:SS (e.g., 09:30:00)"
              >
                <Input
                  type="time"
                  step="1"
                  placeholder="09:30:00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Check Out Time"
                name="check_out_time"
                tooltip="Format: HH:MM:SS (e.g., 18:00:00)"
              >
                <Input
                  type="time"
                  step="1"
                  placeholder="18:00:00"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Work Mode"
                name="work_mode"
                tooltip="Where the employee worked from"
              >
                <Select placeholder="Select work mode">
                  <Select.Option value="office">
                    <Space>
                      <BankOutlined />
                      Office
                    </Space>
                  </Select.Option>
                  <Select.Option value="wfh">
                    <Space>
                      <HomeOutlined />
                      Work From Home
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Working Hours"
                name="working_hours"
                tooltip="Format: 8h 30m or leave empty for auto-calculation"
              >
                <Input placeholder="e.g., 8h 30m" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Select.Option value="present">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  Present
                </Space>
              </Select.Option>
              <Select.Option value="absent">
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  Absent
                </Space>
              </Select.Option>
              <Select.Option value="late">
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  Late
                </Space>
              </Select.Option>
              <Select.Option value="half-day">
                <Space>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  Half Day
                </Space>
              </Select.Option>
              <Select.Option value="on-leave">
                <Space>
                  <CalendarOutlined style={{ color: '#722ed1' }} />
                  On Leave
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea
              rows={3}
              placeholder="Add notes (optional)"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
