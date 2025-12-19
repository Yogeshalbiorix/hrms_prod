import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Space,
  Typography,
  Avatar,
  Tag,
  Row,
  Col,
  Spin,
  Empty,
  Badge,
  Tabs,
  Segmented,
  Alert,
  App
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  EditOutlined,
  ApartmentOutlined,
  SearchOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  FilterOutlined,
  UserAddOutlined,
  DragOutlined,
  HolderOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

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

interface OrgNode {
  employee: Employee;
  children: OrgNode[];
  level: number;
}

export default function OrganizationHierarchy() {
  console.log('OrganizationHierarchy component rendered');

  const { message } = App.useApp();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [orgTree, setOrgTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'top' | 'me'>('top');
  const [groupByDept, setGroupByDept] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Record<number, any>>({});
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Fetching data for OrganizationHierarchy...');
    fetchCurrentUser();
    fetchEmployees();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [employees, searchQuery, viewMode, groupByDept, currentUser]);

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
        // Find current user in employees list
        const user = data.data;
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

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
        // Filter out terminated employees from organization hierarchy
        const activeEmployees = data.data.filter((emp: Employee) => emp.status !== 'terminated');
        console.log('Fetched employees:', activeEmployees.length);
        console.log('Sample employee:', activeEmployees[0]);
        setEmployees(activeEmployees);
        if (activeEmployees.length === 0) {
          message.warning('No employees found in the database');
        }
      } else {
        message.error(data.error || 'Failed to load employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((emp) =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
    buildHierarchyTree(filtered);
  };

  const fetchTodayAttendance = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(`/api/attendance?date=${today}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json() as any;

      if (data.success) {
        const attendanceMap: Record<number, any> = {};
        data.data.forEach((record: any) => {
          attendanceMap[record.employee_id] = record;
        });
        setTodayAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      fetchTodayAttendance();
      const interval = setInterval(fetchTodayAttendance, 30000);
      return () => clearInterval(interval);
    }
  }, [employees]);

  const getActivityStatus = (employeeId: number): 'active' | 'inactive' => {
    const attendance = todayAttendance[employeeId];
    if (!attendance) return 'inactive';
    if (attendance.check_in_time && !attendance.check_out_time) {
      return 'active';
    }
    return 'inactive';
  };

  const buildHierarchyTree = (employeeList: Employee[]) => {
    if (employeeList.length === 0) {
      console.log('No employees to build tree');
      setOrgTree([]);
      return;
    }

    const buildNode = (employee: Employee, level: number = 0): OrgNode => {
      const children = employeeList.filter(emp => emp.manager_id === employee.id);

      return {
        employee,
        children: children.map(child => buildNode(child, level + 1)),
        level,
      };
    };

    let rootEmployees: Employee[] = [];

    if (viewMode === 'me' && currentUser) {
      // Show current user as root
      const currentEmp = employeeList.find(emp => emp.id === currentUser.id);
      if (currentEmp) {
        rootEmployees = [currentEmp];
        console.log('Building tree for current user:', currentEmp.first_name, currentEmp.last_name);
      } else {
        console.log('Current user not found in employee list');
      }
    } else {
      // Show top-level employees (no manager)
      rootEmployees = employeeList.filter(emp => !emp.manager_id);
      console.log('Found', rootEmployees.length, 'top-level employees');

      // If no top-level employees, show first 6 employees as roots with warning
      if (rootEmployees.length === 0) {
        console.warn('No employees without managers found. Showing sample employees.');
        rootEmployees = employeeList.slice(0, 6);
      }
    }

    if (groupByDept) {
      // Group by department
      const deptMap = new Map<string, Employee[]>();
      rootEmployees.forEach(emp => {
        const dept = emp.department_name || 'No Department';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, []);
        }
        deptMap.get(dept)!.push(emp);
      });

      // Build tree for each department
      const tree: OrgNode[] = [];
      deptMap.forEach((emps) => {
        emps.forEach(emp => {
          tree.push(buildNode(emp));
        });
      });
      setOrgTree(tree);
      console.log('Built grouped tree with', tree.length, 'root nodes');
    } else {
      const tree = rootEmployees.map(emp => buildNode(emp));
      setOrgTree(tree);
      console.log('Built tree with', tree.length, 'root nodes');
    }
  };

  const handleEditHierarchy = (employee: Employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      employee_id: employee.id,
      manager_id: employee.manager_id,
      position: employee.position,
      hierarchy_level: employee.hierarchy_level || 1,
    });
    setModalVisible(true);
  };

  const handleUpdateHierarchy = async () => {
    try {
      const values = await form.validateFields();
      const sessionToken = localStorage.getItem('sessionToken');

      const response = await fetch(`/api/employees/${editingEmployee?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          manager_id: values.manager_id,
          position: values.position,
          hierarchy_level: values.hierarchy_level,
        }),
      });

      const result = await response.json() as any;

      if (result.success) {
        message.success('Hierarchy updated successfully');
        setModalVisible(false);
        form.resetFields();
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        message.error(result.error || 'Failed to update hierarchy');
      }
    } catch (error) {
      console.error('Error updating hierarchy:', error);
      message.error('Failed to update hierarchy');
    }
  };

  const getPotentialManagers = () => {
    if (!editingEmployee) return employees;

    const subordinateIds = new Set<number>();
    const findSubordinates = (empId: number) => {
      subordinateIds.add(empId);
      employees
        .filter(e => e.manager_id === empId)
        .forEach(e => findSubordinates(e.id));
    };

    findSubordinates(editingEmployee.id);

    return employees.filter(e => !subordinateIds.has(e.id));
  };

  const handleDragStart = (e: React.DragEvent, employee: Employee) => {
    console.log('Drag started for employee:', employee.first_name, employee.last_name);
    setDraggedEmployee(employee);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    // Add a slight delay to show visual feedback
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedEmployee(null);
    setDropTargetId(null);
    setIsDragging(false);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, targetEmployee: Employee) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Don't allow dropping on self or if would create circular reference
    if (draggedEmployee && draggedEmployee.id !== targetEmployee.id) {
      setDropTargetId(targetEmployee.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetEmployee: Employee) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Drop event triggered on:', targetEmployee.first_name, targetEmployee.last_name);
    console.log('Dragged employee:', draggedEmployee);

    setDropTargetId(null);
    setIsDragging(false);

    if (!draggedEmployee || draggedEmployee.id === targetEmployee.id) {
      console.log('No dragged employee or dropping on self, aborting');
      setDraggedEmployee(null);
      return;
    }

    // Check for circular reference
    const wouldCreateCircularRef = (empId: number, newManagerId: number): boolean => {
      if (empId === newManagerId) return true;
      const manager = employees.find(e => e.id === newManagerId);
      if (!manager || !manager.manager_id) return false;
      return wouldCreateCircularRef(empId, manager.manager_id);
    };

    if (wouldCreateCircularRef(draggedEmployee.id, targetEmployee.id)) {
      console.log('Circular reference detected');
      message.error('Cannot assign: This would create a circular reporting structure');
      setDraggedEmployee(null);
      return;
    }

    console.log('Updating hierarchy via API...', {
      employeeId: draggedEmployee.id,
      newManagerId: targetEmployee.id,
      newLevel: (targetEmployee.hierarchy_level || 3) + 1
    });

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/employees/${draggedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          manager_id: targetEmployee.id,
          hierarchy_level: (targetEmployee.hierarchy_level || 3) + 1,
        }),
      });

      console.log('API Response status:', response.status);
      const result = await response.json() as any;
      console.log('API Response data:', result);

      if (result.success) {
        message.success(
          `${draggedEmployee.first_name} ${draggedEmployee.last_name} now reports to ${targetEmployee.first_name} ${targetEmployee.last_name}`
        );
        await fetchEmployees();
      } else {
        console.error('API returned error:', result.error);
        message.error(result.error || 'Failed to update reporting relationship');
      }
    } catch (error) {
      console.error('Error updating hierarchy:', error);
      message.error('Failed to update reporting relationship');
    }

    setDraggedEmployee(null);
  };

  const renderEmployeeCard = (node: OrgNode, isRoot = false) => {
    const emp = node.employee;
    const isActive = getActivityStatus(emp.id) === 'active';

    return (
      <div
        key={emp.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div
          draggable={true}
          onDragStart={(e) => handleDragStart(e, emp)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, emp)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, emp)}
          style={{
            background: dropTargetId === emp.id ? '#e6f7ff' : '#ffffff',
            border: dropTargetId === emp.id ? '2px dashed #1890ff' : '1px solid #d9d9d9',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '200px',
            maxWidth: '220px',
            cursor: isDragging ? 'move' : 'grab',
            transition: 'all 0.3s',
            boxShadow: dropTargetId === emp.id ? '0 4px 16px rgba(24, 144, 255, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.borderColor = '#1890ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = '#d9d9d9';
            }
          }}
        >
          <div style={{ textAlign: 'center', position: 'relative' }}>
            {/* Drag Handle Indicator */}
            <div style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#1890ff',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <HolderOutlined style={{ color: '#fff', fontSize: 12 }} />
            </div>

            <Badge
              dot
              status={isActive ? 'success' : 'default'}
              offset={[-8, 8]}
            >
              <Avatar
                size={56}
                src={emp.profile_image}
                style={{ backgroundColor: '#3b82f6', marginBottom: 8 }}
              >
                {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
              </Avatar>
            </Badge>
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 14, display: 'block' }}>
                {emp.first_name} {emp.last_name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                {emp.position}
              </Text>
              {emp.department_name && (
                <Tag color="blue" style={{ marginTop: 8, fontSize: 11 }}>
                  {emp.department_name}
                </Tag>
              )}
            </div>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditHierarchy(emp)}
              style={{
                marginTop: 8,
                fontSize: 12,
              }}
            >
              Edit
            </Button>
          </div>
        </div>

        {node.children.length > 0 && (
          <>
            <div
              style={{
                width: '2px',
                height: '30px',
                background: '#d9d9d9',
                margin: '0 auto',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: '40px',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {node.children.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '0',
                    right: '0',
                    height: '2px',
                    background: '#d9d9d9',
                    width: `calc(100% - ${40 * 2}px)`,
                    margin: '0 auto',
                  }}
                />
              )}
              {node.children.map((child) => (
                <div key={child.employee.id} style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '2px',
                      height: '30px',
                      background: '#d9d9d9',
                      margin: '0 auto',
                    }}
                  />
                  {renderEmployeeCard(child)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const handleViewModeChange = (value: string | number) => {
    setViewMode(value as 'top' | 'me');
  };

  const handleGroupByDept = () => {
    setGroupByDept(!groupByDept);
    message.info(groupByDept ? 'Ungrouped by department' : 'Grouped by department');
  };

  const handleDownload = () => {
    message.info('Download functionality will export org chart as PDF');
    // TODO: Implement PDF export
  };

  const handleFullscreen = () => {
    if (chartRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        chartRef.current.requestFullscreen();
      }
    }
  };

  const getHierarchyStats = () => {
    const managers = employees.filter(emp =>
      employees.some(e => e.manager_id === emp.id)
    ).length;

    const levels = new Set(employees.map(emp => emp.hierarchy_level || 1)).size;

    return {
      total: employees.length,
      managers,
      levels,
    };
  };

  const stats = getHierarchyStats();

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>
            <ApartmentOutlined /> Organization Hierarchy
          </Title>
          <Text type="secondary">Visual organization structure and reporting relationships</Text>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Space>
              <Avatar size={48} style={{ backgroundColor: '#1890ff' }}>
                <TeamOutlined />
              </Avatar>
              <div>
                <Text type="secondary">Total Employees</Text>
                <Title level={2} style={{ margin: 0 }}>{stats.total}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space>
              <Avatar size={48} style={{ backgroundColor: '#52c41a' }}>
                <UserOutlined />
              </Avatar>
              <div>
                <Text type="secondary">Managers</Text>
                <Title level={2} style={{ margin: 0 }}>{stats.managers}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space>
              <Avatar size={48} style={{ backgroundColor: '#faad14' }}>
                <ApartmentOutlined />
              </Avatar>
              <div>
                <Text type="secondary">Hierarchy Levels</Text>
                <Title level={2} style={{ margin: 0 }}>{stats.levels}</Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Drag and Drop Instructions */}
      <Alert
        message="💡 Drag & Drop Enabled"
        description="Drag any employee card and drop it onto another employee to reassign reporting relationships. The dropped employee will report to the target employee."
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      {/* Top Controls */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="300px">
            <Search
              placeholder="Search employee"
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="large"
              allowClear
            />
          </Col>
          <Col flex="auto">
            <Space style={{ float: 'right' }}>
              <Segmented
                options={[
                  { label: 'Top of the Org', value: 'top', icon: <ApartmentOutlined /> },
                  { label: 'My Team', value: 'me', icon: <UserOutlined /> },
                ]}
                value={viewMode}
                onChange={handleViewModeChange}
              />
              <Button
                icon={<FilterOutlined />}
                onClick={handleGroupByDept}
                type={groupByDept ? 'primary' : 'default'}
              >
                Group by department
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                title="Download as PDF"
              />
              <Button
                icon={<FullscreenOutlined />}
                onClick={handleFullscreen}
                title="Fullscreen"
              />
            </Space>
          </Col>
        </Row>
      </div>

      {/* Dragging Overlay */}
      {isDragging && draggedEmployee && (
        <Alert
          message={`Dragging: ${draggedEmployee.first_name} ${draggedEmployee.last_name}`}
          description="Drop on another employee to reassign reporting relationship"
          type="warning"
          showIcon
          icon={<DragOutlined />}
          style={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 1000,
            maxWidth: 300,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        />
      )}

      {/* Organization Chart */}
      <div
        ref={chartRef}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          paddingBottom: '60px',
          overflowX: 'auto',
          overflowY: 'auto',
          minHeight: '500px',
          maxHeight: 'calc(100vh - 280px)',
          border: '1px solid #d9d9d9',
          position: 'relative'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : orgTree.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Empty
              description={
                <div>
                  <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                    No organization hierarchy configured
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {filteredEmployees.length > 0
                      ? 'Configure reporting relationships by clicking "Edit" on employee cards'
                      : 'No employees found. Add employees first to build your organization hierarchy.'}
                  </Text>
                  {filteredEmployees.length > 0 && (
                    <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto', marginTop: 16 }}>
                      <Text strong>To set up hierarchy:</Text>
                      <ol style={{ marginTop: 8 }}>
                        <li>Assign manager relationships in employee profiles</li>
                        <li>Use the "Assign Team" feature to bulk assign employees</li>
                        <li>Set hierarchy levels (CEO = 1, Staff = 5)</li>
                      </ol>
                    </div>
                  )}
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div>
            {/* Show warning if no hierarchy is configured */}
            {employees.length > 0 && employees.filter(emp => !emp.manager_id).length === employees.length && (
              <Alert
                message="No Hierarchy Configured"
                description="None of your employees have manager relationships set up. Click 'Edit' on any employee card below to assign reporting relationships, or use 'Assign Team' to bulk assign employees to managers."
                type="warning"
                showIcon
                closable
                style={{ marginBottom: 24 }}
              />
            )}

            {/* Display hierarchy tree or grid */}
            {orgTree.length === 1 ? (
              // Single root - show as tree
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {renderEmployeeCard(orgTree[0], true)}
              </div>
            ) : orgTree.length > 6 ? (
              // Many roots without hierarchy - show as grid
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16, textAlign: 'center' }}>
                  Showing {orgTree.length} employees without reporting relationships
                </Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '24px',
                  justifyItems: 'center'
                }}>
                  {orgTree.map((node) => renderEmployeeCard(node, true))}
                </div>
              </div>
            ) : (
              // Few roots - show as flex row
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                {orgTree.map((node) => renderEmployeeCard(node, true))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Hierarchy Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            <span>Edit Hierarchy - {editingEmployee?.first_name} {editingEmployee?.last_name}</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleUpdateHierarchy}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingEmployee(null);
        }}
        okText="Update"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="manager_id"
            label="Reports To (Manager)"
            rules={[{ required: false, message: 'Please select a manager' }]}
          >
            <Select
              placeholder="Select manager (leave empty for top-level)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={getPotentialManagers().map(emp => ({
                value: emp.id,
                label: `${emp.first_name} ${emp.last_name} - ${emp.position}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="position"
            label="Position/Role"
            rules={[{ required: true, message: 'Please enter position' }]}
          >
            <Input placeholder="e.g., CEO, Project Manager, Team Leader" />
          </Form.Item>

          <Form.Item
            name="hierarchy_level"
            label="Hierarchy Level"
            rules={[{ required: true, message: 'Please select hierarchy level' }]}
            tooltip="1 = Top level (CEO), 2 = Senior Management, 3 = Middle Management, 4+ = Staff"
          >
            <Select
              options={[
                { value: 1, label: 'Level 1 - Executive (CEO, Directors)' },
                { value: 2, label: 'Level 2 - Senior Management (VP, Heads)' },
                { value: 3, label: 'Level 3 - Middle Management (Managers, Team Leads)' },
                { value: 4, label: 'Level 4 - Staff (Seniors, Leads)' },
                { value: 5, label: 'Level 5 - Junior Staff' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
