import React from 'react';
import { Tabs } from 'antd';
import { CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import AttendanceManagement from './AttendanceManagement';
import LeaveManagement from './LeaveManagement';

export default function AttendanceLeaveWrapper() {
  const items = [
    {
      key: 'attendance',
      label: (
        <span>
          <CalendarOutlined />
          Attendance
        </span>
      ),
      children: <AttendanceManagement />,
    },
    {
      key: 'leave',
      label: (
        <span>
          <FileTextOutlined />
          Leave Management
        </span>
      ),
      children: <LeaveManagement />,
    },
  ];

  return (
    <Tabs
      defaultActiveKey="attendance"
      items={items}
      size="large"
      type="card"
    />
  );
}
