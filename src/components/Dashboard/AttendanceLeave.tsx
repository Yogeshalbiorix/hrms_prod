import React from 'react';
import AttendanceManagement from './AttendanceManagement';
import LeaveManagement from './LeaveManagement';
import MarkAttendance from './MarkAttendance';
import EmployeeAttendanceDetails from './EmployeeAttendanceDetails';
import { Tabs } from 'antd';
import { CalendarOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

interface AttendanceLeaveProps {
  selectedEmployee?: {
    id: number;
    name: string;
    code: string;
    position: string;
    department: string;
    email: string;
    phone?: string;
  };
  onBackToOrg?: () => void;
}

export default function AttendanceLeave({ selectedEmployee, onBackToOrg }: AttendanceLeaveProps) {
  // If a specific employee is selected, show their details
  if (selectedEmployee && onBackToOrg) {
    return (
      <EmployeeAttendanceDetails
        employeeId={selectedEmployee.id}
        employeeName={selectedEmployee.name}
        employeeCode={selectedEmployee.code}
        position={selectedEmployee.position}
        department={selectedEmployee.department}
        email={selectedEmployee.email}
        phone={selectedEmployee.phone}
        onBack={onBackToOrg}
      />
    );
  }

  // Default view - show tabs
  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultActiveKey="mark-attendance" size="large" type="card">
        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              Mark Attendance
            </span>
          }
          key="mark-attendance"
        >
          <MarkAttendance />
        </TabPane>
        <TabPane
          tab={
            <span>
              <CalendarOutlined />
              Attendance Records
            </span>
          }
          key="attendance"
        >
          <AttendanceManagement />
        </TabPane>
        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              Leave Management
            </span>
          }
          key="leave"
        >
          <LeaveManagement />
        </TabPane>
      </Tabs>
    </div>
  );
}
