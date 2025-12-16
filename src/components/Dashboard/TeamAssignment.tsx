import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Table,
  App,
  Space,
  Typography,
  Avatar,
  Tag,
  Modal,
  Divider,
  Empty,
  Spin,
  Alert,
  Transfer
} from 'antd';
import type { TransferProps } from 'antd';
import {
  UserAddOutlined,
  TeamOutlined,
  DeleteOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department_name?: string;
  manager_id?: number;
  profile_image?: string;
  hierarchy_level?: number;
  status?: string;
}

interface RecordType {
  key: string;
  title: string;
  description: string;
  disabled?: boolean;
}

export default function TeamAssignment() {
  const { message } = App.useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    console.log('TeamAssignment component mounted');
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedManager) {
      loadManagerTeam();
    }
  }, [selectedManager, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');

      if (!sessionToken) {
        message.error('Not authenticated. Please login again.');
        return;
      }

      console.log('Fetching employees for team assignment...');
      const response = await fetch('/api/employees', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      console.log('Employees fetched:', data);

      if (data.success && data.data) {
        // Filter out terminated employees from team assignment
        const activeEmployees = data.data.filter((emp: Employee) => emp.status !== 'terminated');
        console.log('Total active employees:', activeEmployees.length);
        setEmployees(activeEmployees);

        if (activeEmployees.length === 0) {
          message.warning('No employees found in the system');
        }
      } else {
        message.error(data.error || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error(`Failed to load employees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadManagerTeam = () => {
    if (!selectedManager) return;

    // Get current team members (employees reporting to selected manager)
    const team = employees.filter(emp => emp.manager_id === selectedManager);
    setCurrentTeam(team);
    console.log('Manager', selectedManager, 'has', team.length, 'team members');

    // Get available employees (not already in this team and not the manager itself)
    const available = employees.filter(
      emp => emp.id !== selectedManager && emp.manager_id !== selectedManager
    );
    setAvailableEmployees(available);
    console.log('Available employees:', available.length);

    // Set target keys for transfer component
    setTargetKeys(team.map(emp => emp.id.toString()));
  };

  const handleAssignTeam = () => {
    if (!selectedManager) {
      message.warning('Please select a manager first');
      return;
    }
    setModalVisible(true);
  };

  const handleTransferChange: TransferProps['onChange'] = (newTargetKeys) => {
    setTargetKeys(newTargetKeys as string[]);
  };

  const handleTransferSelectChange: TransferProps['onSelectChange'] = (
    sourceSelectedKeys,
    targetSelectedKeys,
  ) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys] as string[]);
  };

  const handleSaveAssignments = async () => {
    if (!selectedManager) {
      message.error('No manager selected');
      return;
    }

    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');

      if (!sessionToken) {
        message.error('Not authenticated. Please login again.');
        return;
      }

      // Get employees that should be added (in targetKeys but not in currentTeam)
      const currentTeamIds = currentTeam.map(emp => emp.id.toString());
      const toAdd = targetKeys.filter(key => !currentTeamIds.includes(key));

      // Get employees that should be removed (in currentTeam but not in targetKeys)
      const toRemove = currentTeamIds.filter(key => !targetKeys.includes(key));

      console.log('Saving team assignments:');
      console.log('- Manager ID:', selectedManager);
      console.log('- To Add:', toAdd.length, 'employees');
      console.log('- To Remove:', toRemove.length, 'employees');

      let successCount = 0;
      let errorCount = 0;

      // Update employees being added
      for (const empIdStr of toAdd) {
        const empId = parseInt(empIdStr);
        try {
          console.log(`Adding employee ${empId} to manager ${selectedManager}`);
          const response = await fetch(`/api/employees/${empId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              manager_id: selectedManager,
            }),
          });

          console.log(`Response status: ${response.status} ${response.statusText}`);

          let result;
          try {
            result = await response.json() as any;
            console.log('Response body:', result);
          } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            errorCount++;
            continue;
          }

          if (response.ok && result.success) {
            successCount++;
            console.log(`✓ Employee ${empId} assigned successfully`);
          } else {
            errorCount++;
            console.error(`✗ Failed to assign employee ${empId}:`);
            console.error('  - HTTP Status:', response.status);
            console.error('  - Error:', result.error || 'Unknown error');
            console.error('  - Full response:', result);
          }
        } catch (err) {
          errorCount++;
          console.error(`✗ Error assigning employee ${empId}:`, err);
        }
      }

      // Update employees being removed
      for (const empIdStr of toRemove) {
        const empId = parseInt(empIdStr);
        try {
          console.log(`Removing employee ${empId} from manager ${selectedManager}`);
          const response = await fetch(`/api/employees/${empId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              manager_id: null,
            }),
          });

          console.log(`Response status: ${response.status} ${response.statusText}`);

          let result;
          try {
            result = await response.json() as any;
            console.log('Response body:', result);
          } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            errorCount++;
            continue;
          }

          if (response.ok && result.success) {
            successCount++;
            console.log(`✓ Employee ${empId} unassigned successfully`);
          } else {
            errorCount++;
            console.error(`✗ Failed to unassign employee ${empId}:`);
            console.error('  - HTTP Status:', response.status);
            console.error('  - Error:', result.error || 'Unknown error');
            console.error('  - Full response:', result);
          }
        } catch (err) {
          errorCount++;
          console.error(`✗ Error unassigning employee ${empId}:`, err);
        }
      }

      console.log(`Team assignment complete: ${successCount} success, ${errorCount} errors`);

      if (errorCount > 0 && successCount === 0) {
        message.error({
          content: `All ${errorCount} assignments failed. This is likely because:\n1. Database is not properly configured\n2. manager_id column is missing\n3. Running without wrangler dev\n\nCheck browser console (F12) for details.`,
          duration: 10
        });
      } else if (errorCount > 0) {
        message.warning(`${successCount} assignments successful, ${errorCount} failed. Check console for details.`);
      } else if (successCount > 0) {
        message.success(`Team assignments updated successfully (${successCount} changes)`);
      } else {
        message.info('No changes made');
      }

      setModalVisible(false);
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating team assignments:', error);
      message.error(`Failed to update team assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromTeam = async (employeeId: number) => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          manager_id: null,
        }),
      });

      const result = await response.json() as any;

      if (result.success) {
        message.success('Employee removed from team');
        await fetchEmployees();
      } else {
        message.error('Failed to remove employee');
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      message.error('Failed to remove employee');
    } finally {
      setLoading(false);
    }
  };

  const getManagerInfo = (managerId: number | null) => {
    if (!managerId) return null;
    return employees.find(emp => emp.id === managerId);
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: Employee) => (
        <Space>
          <Avatar
            src={record.profile_image}
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.first_name.charAt(0)}{record.last_name.charAt(0)}
          </Avatar>
          <div>
            <div>
              <Text strong>{record.first_name} {record.last_name}</Text>
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
      render: (position: string) => <Tag color="blue">{position}</Tag>,
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Employee) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: 'Remove from team?',
              content: `Remove ${record.first_name} ${record.last_name} from this team?`,
              onOk: () => handleRemoveFromTeam(record.id),
              okText: 'Remove',
              okType: 'danger',
            });
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  // Potential managers (all active employees can be managers)
  // Anyone can have team members assigned to them
  const potentialManagers = employees;

  console.log('Potential managers:', potentialManagers.length, 'out of', employees.length, 'employees');

  // Prepare data for Transfer component
  const transferData: RecordType[] = employees
    .filter(emp => emp.id !== selectedManager)
    .map(emp => ({
      key: emp.id.toString(),
      title: `${emp.first_name} ${emp.last_name}`,
      description: `${emp.position} - ${emp.department_name || 'N/A'}`,
      disabled: false,
    }));

  const selectedManagerInfo = selectedManager ? getManagerInfo(selectedManager) : null;

  // Show loading state while fetching initial data
  if (loading && employees.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="Loading employees..." />
      </div>
    );
  }

  // Show empty state if no employees
  if (!loading && employees.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty
          description={
            <div>
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                No Employees Found
              </Text>
              <Text type="secondary">
                Add employees to the system before assigning teams
              </Text>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>
            <UserAddOutlined /> Team Assignment
          </Title>
          <Text type="secondary">
            Assign employees to managers and build your teams
          </Text>
        </Col>
      </Row>

      {/* Debug Info Alert */}
      {employees.length > 0 && potentialManagers.length === 0 && (
        <Alert
          message="No Potential Managers Found"
          description={`Found ${employees.length} employees, but none have hierarchy_level set or all are level 5+. Employees need hierarchy_level 1-4 to be managers.`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* API Troubleshooting Alert */}
      <Alert
        message="💡 Troubleshooting Team Assignment Issues"
        description={
          <div>
            <Text>If assignments are failing, check these common issues:</Text>
            <ol style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Open browser console (F12) to see detailed error messages</li>
              <li>Ensure the database has the <code>manager_id</code> column</li>
              <li>Verify you're running in development mode (wrangler dev)</li>
              <li>Check that the database migration was applied: <code>db/hierarchy-migration.sql</code></li>
            </ol>
          </div>
        }
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      {/* Manager Selection */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Select Manager / Team Leader</Text>
              <Select
                size="large"
                style={{ width: '100%' }}
                placeholder="Choose a manager to manage their team"
                value={selectedManager}
                onChange={setSelectedManager}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={potentialManagers.map(emp => ({
                  value: emp.id,
                  label: `${emp.first_name} ${emp.last_name} - ${emp.position}`,
                }))}
              />
            </Space>
          </Col>
          {selectedManagerInfo && (
            <Col xs={24} md={12}>
              <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
                <Space>
                  <Avatar
                    size={48}
                    src={selectedManagerInfo.profile_image}
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    {selectedManagerInfo.first_name.charAt(0)}
                    {selectedManagerInfo.last_name.charAt(0)}
                  </Avatar>
                  <div>
                    <Text strong>
                      {selectedManagerInfo.first_name} {selectedManagerInfo.last_name}
                    </Text>
                    <br />
                    <Text type="secondary">{selectedManagerInfo.position}</Text>
                    <br />
                    <Tag color="blue">
                      <TeamOutlined /> {currentTeam.length} Team Members
                    </Tag>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </Card>

      {/* Team Members Table */}
      {selectedManager ? (
        <Card
          title={
            <Space>
              <TeamOutlined />
              <span>Current Team Members</span>
              {currentTeam.length > 0 && (
                <Tag color="green">{currentTeam.length} members</Tag>
              )}
            </Space>
          }
          extra={
            <Space>
              {currentTeam.length > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {currentTeam.length} of {employees.length - 1} employees
                </Text>
              )}
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleAssignTeam}
              >
                {currentTeam.length === 0 ? 'Assign Team Members' : 'Manage Team'}
              </Button>
            </Space>
          }
        >
          {currentTeam.length === 0 ? (
            <Empty
              description={
                <div>
                  <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                    No team members assigned yet
                  </Text>
                  <Text type="secondary">
                    Click "Assign Team Members" to add employees to this manager's team
                  </Text>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<UserAddOutlined />} onClick={handleAssignTeam}>
                Assign Team Members
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={currentTeam}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <Empty
            description={
              <div>
                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                  Select a Manager
                </Text>
                <Text type="secondary">
                  Choose a manager from the dropdown above to view and manage their team
                </Text>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}

      {/* Assignment Modal with Transfer Component */}
      <Modal
        title={
          <Space>
            <SwapOutlined />
            <span>
              Assign Team Members
              {selectedManagerInfo && ` to ${selectedManagerInfo.first_name} ${selectedManagerInfo.last_name}`}
            </span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSaveAssignments}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="Save Assignments"
        confirmLoading={loading}
      >
        <Alert
          message="Team Assignment"
          description="Move employees to the right panel to assign them to this manager's team. Remove them to unassign."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Transfer
          dataSource={transferData}
          titles={['Available Employees', 'Team Members']}
          targetKeys={targetKeys}
          selectedKeys={selectedKeys}
          onChange={handleTransferChange}
          onSelectChange={handleTransferSelectChange}
          render={(item) => (
            <div>
              <div>{item.title}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{item.description}</div>
            </div>
          )}
          listStyle={{
            width: 350,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, option) =>
            option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
            option.description.toLowerCase().includes(inputValue.toLowerCase())
          }
        />

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary">
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> {targetKeys.length} team members will be assigned
          </Text>
          {currentTeam.length > targetKeys.length && (
            <Text type="secondary">
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> {currentTeam.length - targetKeys.length} will be removed
            </Text>
          )}
        </Space>
      </Modal>
    </div>
  );
}
