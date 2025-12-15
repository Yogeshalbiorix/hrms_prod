// Example Ant Design Component for HRMS
// This demonstrates how to use Ant Design components in your project

import React from 'react';
import {
  Button,
  Card,
  Table,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  message,
  Dropdown,
  Modal
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  MoreOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

interface ExampleData {
  key: string;
  name: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export default function AntdExample() {
  const [messageApi, contextHolder] = message.useMessage();

  // Example data
  const data: ExampleData[] = [
    {
      key: '1',
      name: 'John Doe',
      department: 'Engineering',
      status: 'active',
      joinDate: '2024-01-15',
    },
    {
      key: '2',
      name: 'Jane Smith',
      department: 'Marketing',
      status: 'active',
      joinDate: '2024-02-20',
    },
    {
      key: '3',
      name: 'Bob Johnson',
      department: 'Sales',
      status: 'inactive',
      joinDate: '2023-11-10',
    },
  ];

  // Table columns
  const columns: TableColumnsType<ExampleData> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ExampleData, b: ExampleData) => a.name.localeCompare(b.name),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      filters: [
        { text: 'Engineering', value: 'Engineering' },
        { text: 'Marketing', value: 'Marketing' },
        { text: 'Sales', value: 'Sales' },
      ],
      onFilter: (value, record) => record.department === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={status === 'active' ? 'success' : 'default'}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      sorter: (a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const items: MenuProps['items'] = [
          {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
          },
        ];

        return (
          <Dropdown menu={{ items }} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  const handleAdd = () => {
    messageApi.success('Add employee functionality would go here');
  };

  const handleExport = () => {
    messageApi.info('Export functionality would go here');
  };

  return (
    <div className="p-6 space-y-6">
      {contextHolder}

      {/* Header Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ant Design Example</h2>
            <p className="text-gray-600">Demonstrating Ant Design components in your HRMS</p>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Employee
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Space>
        </div>
      </Card>

      {/* Filter Card */}
      <Card title="Filters">
        <Space size="middle" wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by name..."
            style={{ width: 250 }}
          />
          <Select
            placeholder="Select Department"
            style={{ width: 200 }}
            options={[
              { value: 'all', label: 'All Departments' },
              { value: 'engineering', label: 'Engineering' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'sales', label: 'Sales' },
            ]}
          />
          <Select
            placeholder="Status"
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <DatePicker.RangePicker />
          <Button type="default">Reset</Button>
        </Space>
      </Card>

      {/* Data Table */}
      <Card title="Employees">
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <UserOutlined className="text-4xl text-blue-500 mb-2" />
            <div className="text-2xl font-bold">247</div>
            <div className="text-gray-600">Total Employees</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CheckCircleOutlined className="text-4xl text-green-500 mb-2" />
            <div className="text-2xl font-bold">234</div>
            <div className="text-gray-600">Active</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CloseCircleOutlined className="text-4xl text-red-500 mb-2" />
            <div className="text-2xl font-bold">13</div>
            <div className="text-gray-600">Inactive</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <PlusOutlined className="text-4xl text-purple-500 mb-2" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-gray-600">New This Month</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
