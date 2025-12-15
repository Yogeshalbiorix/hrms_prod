import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Table,
  Modal,
  Form,
  Space,
  Tag,
  Tooltip,
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  BankOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { baseUrl } from '../../lib/base-url';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/departments`);
      const data = await response.json() as any;
      if (data.success) {
        setDepartments(data.data);
      } else {
        console.error('Failed to fetch departments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    try {
      if (!formData.name.trim()) {
        Modal.warning({
          title: 'Validation Error',
          content: 'Please enter a department name',
        });
        return;
      }

      const response = await fetch(`${baseUrl}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as any;
      if (data.success) {
        setShowAddDialog(false);
        resetForm();
        fetchDepartments();
        Modal.success({
          title: 'Success',
          content: 'Department created successfully!',
        });
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to create department',
        });
      }
    } catch (error) {
      console.error('Error creating department:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to create department. Please try again.',
      });
    }
  };

  const handleDeleteDepartment = async (id: number, employeeCount: number) => {
    if (employeeCount > 0) {
      Modal.warning({
        title: 'Cannot Delete Department',
        content: `Cannot delete department with ${employeeCount} employee(s). Please reassign employees first.`,
      });
      return;
    }

    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this department?',
      okText: 'Yes, Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await fetch(`${baseUrl}/api/departments?id=${id}`, {
            method: 'DELETE',
          });

          const data = await response.json() as any;
          if (data.success) {
            fetchDepartments();
            Modal.success({
              title: 'Success',
              content: 'Department deleted successfully',
            });
          } else {
            Modal.error({
              title: 'Error',
              content: data.error || 'Failed to delete department',
            });
          }
        } catch (error) {
          console.error('Error deleting department:', error);
          Modal.error({
            title: 'Error',
            content: 'Failed to delete department. Please try again.',
          });
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnsType<Department> = [
    {
      title: 'Department Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <BankOutlined style={{ color: '#3b82f6', fontSize: 18 }} />
          <Text strong style={{ color: '#1e40af' }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || <Text type="secondary">No description</Text>,
    },
    {
      title: 'Employees',
      dataIndex: 'employee_count',
      key: 'employee_count',
      align: 'center',
      render: (count: number) => (
        <Tag icon={<TeamOutlined />} color="blue">
          {count || 0} {count === 1 ? 'Employee' : 'Employees'}
        </Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_: any, record: Department) => (
        <Space>
          <Tooltip title="Delete Department">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteDepartment(record.id, record.employee_count || 0)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: '#1e40af' }}>
            <BankOutlined style={{ marginRight: 8 }} />
            Department Management
          </Title>
          <Text type="secondary">Organize and manage company departments</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            style={{ background: '#2563eb' }}
          >
            Add Department
          </Button>
        </Col>
      </Row>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Departments"
              value={departments.length}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Employees"
              value={departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Average Team Size"
              value={departments.length > 0
                ? Math.round(departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0) / departments.length)
                : 0
              }
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#dc2626' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Table */}
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="Search departments..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="Loading departments..." />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredDepartments}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} departments`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchTerm
                        ? 'No departments found matching your search'
                        : 'No departments yet. Create your first department!'
                    }
                  >
                    {!searchTerm && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          resetForm();
                          setShowAddDialog(true);
                        }}
                      >
                        Add Department
                      </Button>
                    )}
                  </Empty>
                ),
              }}
            />
          )}
        </Space>
      </Card>

      {/* Add Department Modal */}
      <Modal
        title={
          <Space>
            <BankOutlined style={{ color: '#2563eb' }} />
            <span>Add New Department</span>
          </Space>
        }
        open={showAddDialog}
        onOk={handleAddDepartment}
        onCancel={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        okText="Create Department"
        cancelText="Cancel"
        width={600}
        okButtonProps={{ size: 'large', icon: <PlusOutlined /> }}
        cancelButtonProps={{ size: 'large' }}
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Department Name <span style={{ color: '#ef4444' }}>*</span></span>}
            required
          >
            <Input
              size="large"
              placeholder="e.g., Engineering, Sales, HR"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              prefix={<BankOutlined style={{ color: '#9ca3af' }} />}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Description</span>}
          >
            <TextArea
              rows={4}
              placeholder="Brief description of the department..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Item>

          <Card
            size="small"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <Space align="start">
              <ExclamationCircleOutlined style={{ color: '#2563eb', fontSize: 18 }} />
              <div>
                <Text strong style={{ color: '#1e40af' }}>Note:</Text>
                <br />
                <Text type="secondary">
                  After creating the department, you can assign employees to it through Employee Management.
                </Text>
              </div>
            </Space>
          </Card>
        </Form>
      </Modal>
    </div>
  );
}
