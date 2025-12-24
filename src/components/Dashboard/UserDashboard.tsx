
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Avatar, Dropdown, Button, Typography, Space, Calendar, Badge, List, message, Table, Tag, Progress, Drawer, Timeline, Divider, Modal, Input, Spin, Form, DatePicker, Select, Descriptions, Tooltip, TimePicker, Tabs } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  DollarOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined as ClockOutIcon,
  FieldTimeOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  HourglassOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReadOutlined,
  WarningOutlined,
  FrownOutlined,
  EditOutlined,
  ReloadOutlined,
  EyeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../Auth/AuthContext';
import AppHeader from './Header';
import LeaveDashboard from './LeaveDashboard';
import dayjs from 'dayjs';

// Lazy load components
const ProfilePage = lazy(() => import('./ProfilePage'));
const Settings = lazy(() => import('./Settings'));
const MyTeam = lazy(() => import('./MyTeam'));

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;




const UserDashboard: React.FC = () => {
  // Fetch attendance data for the logged-in user
  const fetchAttendanceData = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/my-attendance?days=30', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const data = (await response.json()) as { success: boolean; data?: any };

      if (data.success && data.data) {
        // Helper to convert UTC time string (HH:MM:SS) to Local time string (HH:MM:SS)
        const convertUTCToLocalTime = (utcTimeStr: string) => {
          if (!utcTimeStr) return null;
          const [h, m, s] = utcTimeStr.split(':').map(Number);
          const date = new Date();
          date.setUTCHours(h, m, s || 0);
          const localH = String(date.getHours()).padStart(2, '0');
          const localM = String(date.getMinutes()).padStart(2, '0');
          const localS = String(date.getSeconds()).padStart(2, '0');
          return `${localH}:${localM}:${localS}`;
        };

        // Transform records
        const transformRecord = (record: any) => {
          if (!record) return null;
          return {
            ...record,
            clock_in: record.clock_in ? convertUTCToLocalTime(record.clock_in) : null,
            clock_out: record.clock_out ? convertUTCToLocalTime(record.clock_out) : null,
            sessions: record.sessions?.map((s: any) => ({
              ...s,
              clock_in: s.clock_in ? convertUTCToLocalTime(s.clock_in) : null,
              clock_out: s.clock_out ? convertUTCToLocalTime(s.clock_out) : null,
            }))
          };
        };

        const localRecords = data.data.records.map(transformRecord);
        const localToday = transformRecord(data.data.today); // This might be null if no record today

        // If localToday is null, check if one of the records matches "today" in local date
        // This handles edge case where UTC date was "yesterday" but Local date is "today" or vice versa
        // But for now, relying on backend's "today" specific field is safer for logic continuity

        const transformedData = {
          ...data.data,
          records: localRecords,
          today: localToday
        };

        setAttendanceData(transformedData);
        setTodayRecord(localToday);
        setIsClockedIn(!!localToday && !localToday.clock_out && !!localToday.clock_in);
      } else {
        setAttendanceData(null);
        setTodayRecord(null);
        setIsClockedIn(false);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData(null);
      setTodayRecord(null);
      setIsClockedIn(false);
      message.error('Failed to load attendance data');
    }
  };

  // Use AuthContext logout directly
  const { logout } = useAuth();

  // Fetch attendance data on mount
  useEffect(() => {
    fetchAttendanceData();
    // Optionally, set up a timer to refresh data periodically
    // const interval = setInterval(fetchAttendanceData, 5 * 60 * 1000); // every 5 min
    // return () => clearInterval(interval);
  }, []);

  // State
  const { user } = useAuth();
  // Add missing collapsed state for Sider
  const [collapsed, setCollapsed] = useState(false);
  // Add missing elapsedTime state for time tracking
  const [elapsedTime, setElapsedTime] = useState(0);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [isClockedIn, setIsClockedIn] = useState(false); // Policy State
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyText, setPolicyText] = useState('');
  const [holidays, setHolidays] = useState<any[]>([]);

  const fetchPolicy = async () => {
    try {
      const [pRes, hRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/holidays')
      ]);
      const pData = await pRes.json() as any;
      const hData = await hRes.json() as any;
      if (pData.text) setPolicyText(pData.text);
      if (hData.holidays) setHolidays(hData.holidays);
    } catch (err) {
      message.error('Failed to load policy info');
    }
  };

  const showPolicyModal = () => {
    fetchPolicy();
    setPolicyModalVisible(true);
  };
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>('attendance');
  const [editingLeave, setEditingLeave] = useState<any | null>(null);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveForm] = Form.useForm();
  // Valid Hook usage at top level
  const selectedLeaveType = Form.useWatch('leave_type', leaveForm);
  const [selectedDayDetails, setSelectedDayDetails] = useState<any>(null);
  const [regularizeDate, setRegularizeDate] = useState<string | null>(null);
  const [regularizeForm] = Form.useForm();
  const [regularizeModalVisible, setRegularizeModalVisible] = useState(false);
  const [regularizeLoading, setRegularizeLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [clockInModalVisible, setClockInModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clockInNotes, setClockInNotes] = useState('');
  const [clockOutModalVisible, setClockOutModalVisible] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [wfhModalVisible, setWfhModalVisible] = useState(false);
  const [wfhDates, setWfhDates] = useState<string[]>([]);
  const [wfhReason, setWfhReason] = useState('');
  const [wfhLoading, setWfhLoading] = useState(false);
  const [partialDayModalVisible, setPartialDayModalVisible] = useState(false);
  const [partialDayDate, setPartialDayDate] = useState('');
  const [partialStartTime, setPartialStartTime] = useState('');
  const [partialEndTime, setPartialEndTime] = useState('');
  const [partialDayReason, setPartialDayReason] = useState('');
  const [partialDayLoading, setPartialDayLoading] = useState(false);
  const [activityRequests, setActivityRequests] = useState<any[]>([]);
  const [activityRequestsLoading, setActivityRequestsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [requestDetailsModalVisible, setRequestDetailsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [is24HourFormat, setIs24HourFormat] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timer effect for elapsedTime
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isClockedIn && todayRecord?.clock_in) {
      const today = new Date();
      const [inHours, inMinutes, inSeconds] = todayRecord.clock_in.split(':').map(Number);
      const clockInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), inHours, inMinutes, inSeconds || 0);
      interval = setInterval(() => {
        const now = new Date();
        setElapsedTime(Math.floor((now.getTime() - clockInDate.getTime()) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, todayRecord]);
  // --- MISSING HANDLERS AND TYPES ---
  // Add missing LeaveRequest type
  type LeaveRequest = {
    id: string;
    status: string;
    type: string;
    [key: string]: any;
  };

  const [leaveBalance, setLeaveBalance] = useState<any>(null);

  // Leave Request Handlers & Logic
  const fetchLeaveRequests = async () => {
    setLeaveLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/leave', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const result = await response.json() as { success: boolean; data?: any[] };
      if (result.success && result.data) {
        setLeaveRequests(result.data);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
    setLeaveLoading(false);
  };

  const fetchLeaveBalance = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/leave/balance', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const result = await response.json() as { success: boolean, data: any };
      if (result.success) {
        setLeaveBalance(result.data);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  useEffect(() => {
    if (selectedMenu === 'leave') {
      fetchLeaveRequests();
      fetchLeaveBalance();
    }
  }, [selectedMenu]);


  const handleRegularizeAttendance = () => {
    setRegularizeModalVisible(true);
  };

  const handleRegularizeSubmit = () => {
    regularizeForm.validateFields().then(values => {
      message.info('Regularize Submit feature coming soon!');
      setRegularizeModalVisible(false);
    });
  };

  const handleEditLeave = (record: LeaveRequest) => {
    setEditingLeave(record);
    leaveForm.setFieldsValue({
      leave_type: record.leave_type,
      dateRange: [dayjs(record.start_date), dayjs(record.end_date)],
      reason: record.reason
    });
    setLeaveModalVisible(true);
  };

  const handleCancelLeave = (id: string) => {
    Modal.confirm({
      title: 'Cancel Leave Request',
      content: 'Are you sure you want to cancel this leave request?',
      onOk: async () => {
        try {
          const sessionToken = localStorage.getItem('sessionToken');
          const response = await fetch(`/api/leave/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ status: 'cancelled' })
          });

          const result = await response.json() as any;
          if (result.success) {
            message.success('Leave request cancelled successfully');
            fetchLeaveRequests();
          } else {
            message.error(result.error || 'Failed to cancel leave');
          }
        } catch (e) {
          console.error('Cancel error:', e);
          message.error('Failed to cancel leave');
        }
      }
    });
  };

  const handleLeaveSubmit = async () => {
    try {
      const values = await leaveForm.validateFields();
      setLeaveLoading(true);

      const sessionToken = localStorage.getItem('sessionToken');
      const payload = {
        leave_type: values.leave_type,
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD'),
        reason: values.reason
      };

      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json() as any;

      if (result.success) {
        message.success('Leave request submitted successfully');
        setLeaveModalVisible(false);
        leaveForm.resetFields();
        fetchLeaveRequests();
      } else {
        message.error(result.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
    setLeaveLoading(false);
  };
  const showPartialDayModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setPartialDayDate(today);
    setPartialDayModalVisible(true);
  };

  const handlePartialDayConfirm = async () => {
    if (!partialDayDate || !partialStartTime || !partialEndTime) {
      message.error('Please fill in all required fields');
      return;
    }

    // Validate time range
    const [startHours, startMinutes] = partialStartTime.split(':').map(Number);
    const [endHours, endMinutes] = partialEndTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      message.error('End time must be after start time');
      return;
    }

    setPartialDayLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/activity/partial-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          date: partialDayDate,
          start_time: partialStartTime,
          end_time: partialEndTime,
          reason: partialDayReason || 'Partial day request'
        })
      });
      const result = await response.json() as any;
      if (result.success) {
        message.success('Partial day request submitted successfully');
        setPartialDayModalVisible(false);
        setPartialDayDate('');
        setPartialStartTime('');
        setPartialEndTime('');
        setPartialDayReason('');
        fetchActivityRequests(); // Refresh the requests list
      } else {
        message.error(result.error || 'Failed to submit partial day request');
      }
    } catch (error) {
      message.error('Failed to submit partial day request');
    }
    setPartialDayLoading(false);
  };


  // All logic, handlers, and helpers are now inside the UserDashboard component.
  // Remove any duplicate or out-of-scope code below this line.

  const getLeaveStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'orange',
      'approved': 'green',
      'rejected': 'red',
      'cancelled': 'default'
    };
    return colors[status] || 'default';
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'sick': 'red',
      'vacation': 'blue',
      'personal': 'purple',
      'maternity': 'pink',
      'paternity': 'cyan',
      'unpaid': 'default'
    };
    return colors[type] || 'default';
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Try to get address using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json() as any;
            const address = data.display_name || 'Unknown location';
            resolve({ latitude, longitude, address });
          } catch (error) {
            resolve({ latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
          }
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
      );
    });
  };

  const showClockInModal = () => {
    setClockInModalVisible(true);
  };

  const handleClockInConfirm = async () => {
    setLoading(true);
    try {
      // Get user location
      const location = await getLocation();

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          work_mode: 'office',
          latitude: location.latitude,
          longitude: location.longitude,
          location_address: location.address,
          notes: clockInNotes
        })
      });
      const result = await response.json() as any;
      console.log('Clock-in response:', result);
      if (result.success) {
        message.success(`${result.message} - Location tracked`);
        setIsClockedIn(true);
        fetchAttendanceData();
        setClockInModalVisible(false);
        setClockInNotes('');
      } else {
        console.error('Clock-in error:', result.error);
        message.error(result.error || 'Failed to clock in');
      }
    } catch (error: any) {
      console.error('Clock-in exception:', error);
      // Handle geolocation errors (code 1 = permission denied, code 3 = timeout)
      if (error.code === 1) {
        message.warning('Location permission denied. Clocking in without location.');
      } else if (error.code === 3) {
        message.warning('Location request timed out. Clocking in without location.');
      } else if (error.message === 'Geolocation is not supported') {
        message.warning('Location not supported. Clocking in without location.');
      }

      // Clock in without location for any location error
      try {
        const sessionToken = localStorage.getItem('sessionToken');
        const response = await fetch('/api/attendance/clock-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ work_mode: 'office', notes: clockInNotes })
        });
        const result = await response.json() as any;
        console.log('Clock-in without location response:', result);
        if (result.success) {
          message.success(result.message);
          setIsClockedIn(true);
          fetchAttendanceData();
          setClockInModalVisible(false);
          setClockInNotes('');
        } else {
          console.error('Clock-in error:', result.error);
          message.error(result.error || 'Failed to clock in');
        }
      } catch (err) {
        console.error('Clock-in exception:', err);
        message.error('Failed to clock in: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
    setLoading(false);
  };

  const showClockOutModal = () => {
    setClockOutModalVisible(true);
  };

  const handleClockOutConfirm = async () => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          notes: clockOutNotes
        })
      });
      const result = await response.json() as any;
      if (result.success) {
        message.success(result.message);
        setIsClockedIn(false);
        fetchAttendanceData();
        setClockOutModalVisible(false);
        setClockOutNotes('');
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('Failed to clock out');
    }
    setLoading(false);
  };

  // Work from home handlers
  const showWfhModal = () => {
    setWfhDates([]);
    setWfhModalVisible(true);
  };

  const handleWfhConfirm = async () => {
    if (!wfhDates.length) {
      message.error('Please select at least one date');
      return;
    }
    setWfhLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/activity/work-from-home', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          dates: wfhDates, // send array of dates
          reason: wfhReason || 'Working from home'
        })
      });
      const result = await response.json() as any;
      if (result.success) {
        message.success('Work from home request submitted successfully');
        setWfhModalVisible(false);
        setWfhDates([]);
        setWfhReason('');
        fetchActivityRequests(); // Refresh the requests list
      } else {
        message.error(result.error || 'Failed to submit work from home request');
      }
    } catch (error) {
      message.error('Failed to submit work from home request');
    }
    setWfhLoading(false);
  };

  // (Removed: now defined inside UserDashboard component)

  // Fetch activity requests
  const fetchActivityRequests = async () => {
    setActivityRequestsLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');

      // Fetch WFH requests
      const wfhResponse = await fetch('/api/activity/work-from-home', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const wfhResult = await wfhResponse.json() as any;

      // Fetch Partial Day requests
      const partialResponse = await fetch('/api/activity/partial-day', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const partialResult = await partialResponse.json() as any;

      // Combine and mark request types
      const wfhRequests = (wfhResult.data || []).map((r: any) => ({ ...r, type: 'wfh' }));
      const partialRequests = (partialResult.data || []).map((r: any) => ({ ...r, type: 'partial' }));

      const allRequests = [...wfhRequests, ...partialRequests]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivityRequests(allRequests);
    } catch (error) {
      console.error('Failed to fetch activity requests:', error);
    }
    setActivityRequestsLoading(false);
  };

  const fetchDayDetails = async (date: string) => {
    setDetailsLoading(true);
    setDrawerVisible(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/attendance/day-details?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: any };
      if (result.success) {
        setSelectedDayDetails(result.data);
      } else {
        message.error('Failed to load details');
      }
    } catch (error) {
      message.error('Error loading day details');
    }
    setDetailsLoading(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      window.location.href = '/';
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'My Attendance',
    },
    {
      key: 'requests',
      icon: <FileTextOutlined />,
      label: 'My Requests',
    },
    {
      key: 'myteam',
      icon: <TeamOutlined />,
      label: 'My Team',
    },
    {
      key: 'leave',
      icon: <CalendarOutlined />,
      label: 'Leave Requests',
    },
    {
      key: 'payroll',
      icon: <DollarOutlined />,
      label: 'Payroll',
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: 'Documents',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  // Generate recent activities from attendance data
  const recentActivities = React.useMemo(() => {
    const activities: any[] = [];

    if (todayRecord && isClockedIn) {
      activities.push({
        title: 'Clocked In',
        time: `Today, ${todayRecord.clock_in}`,
        type: 'success'
      });
    }

    if (attendanceData?.records) {
      const recentRecords = attendanceData.records.slice(0, 5);
      recentRecords.forEach((record: any) => {
        if (record.date !== new Date().toISOString().split('T')[0]) {
          const date = new Date(record.date);
          const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isLate = record.sessions?.some((s: any) => s.notes?.includes('Late'));

          activities.push({
            title: `Attendance: ${record.working_hours || 'Partial'}`,
            time: timeStr,
            type: isLate ? 'warning' : 'success'
          });
        }
      });
    }

    return activities.slice(0, 5);
  }, [attendanceData, todayRecord, isClockedIn]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'HRMS' : 'HRMS Portal'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          onClick={({ key }) => setSelectedMenu(key)}
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            Welcome, {user?.full_name || user?.username}!
          </Title>

          <Space size="large">
            <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    handleLogout();
                  } else {
                    setSelectedMenu(key);
                  }
                }
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>{user?.full_name || user?.username}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{user?.role || 'Employee'}</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          {selectedMenu === 'home' && (
            <div>
              {/* Welcome Section */}
              <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Row align="middle">
                  <Col flex="auto">
                    <Title level={3} style={{ color: 'white', margin: 0 }}>
                      Welcome back, {user?.full_name || user?.username}! ðŸ‘‹
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                      {currentTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </Col>
                  <Col>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '16px 24px',
                      borderRadius: 8,
                      textAlign: 'center'
                    }}>
                      <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', display: 'block' }}>
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {isClockedIn ? 'ðŸŸ¢ Active' : 'âšª Not Clocked In'}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Stats Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Days Present"
                      value={attendanceData?.statistics?.present_days || 0}
                      suffix={`/ ${attendanceData?.statistics?.total_days || 0}`}
                      valueStyle={{ color: '#3f8600' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Average Hours"
                      value={attendanceData?.statistics?.average_hours || '0h 0m'}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<FieldTimeOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="On-Time %"
                      value={attendanceData?.statistics?.on_time_percentage || 100}
                      suffix="%"
                      valueStyle={{ color: '#faad14' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Today's Hours"
                      value={(() => {
                        const hours = Math.floor(elapsedTime / 3600);
                        const minutes = Math.floor((elapsedTime % 3600) / 60);
                        return `${hours}h ${minutes}m`;
                      })()}
                      valueStyle={{ color: isClockedIn ? '#52c41a' : '#999' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Main Content Row */}
              <Row gutter={[16, 16]}>
                {/* Calendar */}
                <Col xs={24} lg={16}>
                  <Card title="Attendance Calendar" bordered={false}>
                    <Calendar
                      fullscreen={false}
                      dateCellRender={(date) => {
                        const dateStr = date.format('YYYY-MM-DD');
                        const record = attendanceData?.records?.find((r: any) => r.date === dateStr);

                        if (record) {
                          const isLate = record.sessions?.some((s: any) => s.notes?.includes('Late'));
                          const hasActive = record.has_active_session;

                          if (hasActive) {
                            return <Badge status="processing" text="Active" />;
                          } else if (isLate) {
                            return <Badge status="warning" text="Late" />;
                          } else if (record.status === 'present') {
                            return <Badge status="success" text="Present" />;
                          } else if (record.status === 'absent') {
                            return <Badge status="error" text="Absent" />;
                          }
                        }
                        return null;
                      }}
                    />
                  </Card>
                </Col>

                {/* Recent Activities */}
                <Col xs={24} lg={8}>
                  <Card title="Recent Activities" bordered={false}>
                    <List
                      dataSource={recentActivities}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Badge status={item.type as any} />
                            }
                            title={item.title}
                            description={item.time}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>

                  <Card
                    title="Quick Actions"
                    bordered={false}
                    style={{ marginTop: 16 }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        block
                        icon={<ClockCircleOutlined />}
                        onClick={() => setSelectedMenu('attendance')}
                      >
                        Mark Attendance
                      </Button>
                      <Button
                        block
                        icon={<CalendarOutlined />}
                        onClick={() => setSelectedMenu('leave')}
                      >
                        Request Leave
                      </Button>
                      <Button
                        block
                        icon={<FileTextOutlined />}
                        onClick={() => setSelectedMenu('requests')}
                      >
                        View My Requests
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {selectedMenu === 'attendance' && (
            <div>
              {/* Top Section - Stats, Timings, Actions */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {/* Attendance Stats */}
                <Col xs={24} lg={8}>
                  <Card
                    title={<><ClockCircleOutlined /> Attendance Stats</>}
                    bordered={false}
                    style={{ height: '100%' }}
                  >
                    <div style={{ marginBottom: 24 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>PERIOD</Text>
                      <br />
                      <Text strong>Last Week</Text>
                    </div>

                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ padding: 16, backgroundColor: '#f0f5ff', borderRadius: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>AVG HRS / DAY</Text>
                          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                            {attendanceData?.statistics?.average_hours || '0h 0m'}
                          </Title>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ padding: 16, backgroundColor: '#f6ffed', borderRadius: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>ON TIME ARRIVAL</Text>
                          <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                            {attendanceData?.statistics?.on_time_percentage || 0}%
                          </Title>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* Timings - Today's Schedule */}
                <Col xs={24} lg={8}>
                  <Card
                    title={<><FieldTimeOutlined /> Timings</>}
                    bordered={false}
                    style={{ height: '100%' }}
                  >
                    {/* Week Days */}
                    <div style={{ marginBottom: 16 }}>
                      <Space size={8}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: idx === currentTime.getDay() - 1 || (idx === 6 && currentTime.getDay() === 0) ? '#1890ff' : '#f0f0f0',
                              color: idx === currentTime.getDay() - 1 || (idx === 6 && currentTime.getDay() === 0) ? 'white' : '#666',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: 12
                            }}
                          >
                            {day}
                          </div>
                        ))}
                      </Space>
                    </div>

                    {/* Today's Schedule */}
                    {todayRecord && (
                      <>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Today ({todayRecord.clock_in || '--:--'} - {todayRecord.clock_out || '7:30 PM'})
                        </Text>
                        <div style={{ marginTop: 8, marginBottom: 12 }}>
                          <Progress
                            percent={(() => {
                              // Expected work: 8 hours (480 minutes)
                              const expectedMinutes = 480;
                              const workedMinutes = elapsedTime / 60;
                              const percentage = Math.min(100, (workedMinutes / expectedMinutes) * 100);
                              return Math.round(percentage);
                            })()}
                            showInfo={true}
                            strokeColor={{
                              '0%': '#52c41a',
                              '50%': '#1890ff',
                              '100%': '#faad14'
                            }}
                            format={(percent) => `${Math.floor((elapsedTime / 60) / 60)}h ${Math.floor((elapsedTime / 60) % 60)}m`}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>Target: 8h 0m (+ 1h lunch)</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {isClockedIn ? 'ðŸŸ¢ Working' : 'âšª Not Clocked In'}
                          </Text>
                        </div>
                      </>
                    )}
                  </Card>
                </Col>

                {/* Actions */}
                <Col xs={24} lg={8}>
                  <Card
                    title={<>Actions</>}
                    bordered={false}
                    style={{ height: '100%' }}
                    extra={
                      <Button
                        type="text"
                        size="small"
                        icon={<ClockCircleOutlined />}
                        onClick={() => setIs24HourFormat(!is24HourFormat)}
                        style={{ fontSize: 12 }}
                      >
                        24 hour format
                      </Button>
                    }
                  >
                    {/* Live Clock */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <Title level={1} style={{ margin: 0, fontSize: 40, fontWeight: 'bold' }}>
                        {currentTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: !is24HourFormat
                        })}
                      </Title>
                      <Text type="secondary">
                        {currentTime.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </div>

                    {/* Clock In/Out Button */}
                    {!isClockedIn ? (
                      <Button
                        type="primary"
                        size="large"
                        block
                        onClick={showClockInModal}
                        loading={loading}
                        style={{ marginBottom: 12 }}
                      >
                        Web Clock-in
                      </Button>
                    ) : (
                      <Button
                        danger
                        size="large"
                        block
                        onClick={showClockOutModal}
                        loading={loading}
                        style={{ marginBottom: 12 }}
                      >
                        Web Clock-out
                      </Button>
                    )}

                    {/* Total Hours Display - Only show when clocked in */}
                    {isClockedIn && (
                      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff', border: '1px solid #d6e4ff' }}>
                        <Row gutter={16}>
                          <Col span={24}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>TOTAL HOURS</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>Effective:</Text>
                            <Text strong style={{ fontSize: 16, color: '#1890ff', marginLeft: 4 }}>
                              {(() => {
                                if (!todayRecord?.clock_in) return '0h 0m';

                                // Create Date objects for today with the stored times
                                const today = new Date();
                                const [inHours, inMinutes, inSeconds] = todayRecord.clock_in.split(':').map(Number);
                                const clockInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), inHours, inMinutes, inSeconds || 0);

                                let clockOutDate;
                                if (todayRecord.clock_out) {
                                  const [outHours, outMinutes, outSeconds] = todayRecord.clock_out.split(':').map(Number);
                                  clockOutDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), outHours, outMinutes, outSeconds || 0);
                                } else {
                                  // If still working, use current time
                                  clockOutDate = new Date();
                                }

                                const totalSeconds = Math.floor((clockOutDate.getTime() - clockInDate.getTime()) / 1000);
                                const hours = Math.floor(totalSeconds / 3600);
                                const minutes = Math.floor((totalSeconds % 3600) / 60);

                                return `${hours}h ${minutes}m`;
                              })()}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>Gross:</Text>
                            <Text strong style={{ fontSize: 16, color: '#52c41a', marginLeft: 4 }}>
                              {(() => {
                                if (!todayRecord?.clock_in) return '0h 0m';

                                // Create Date objects for today with the stored times
                                const today = new Date();
                                const [inHours, inMinutes, inSeconds] = todayRecord.clock_in.split(':').map(Number);
                                const clockInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), inHours, inMinutes, inSeconds || 0);

                                let clockOutDate;
                                if (todayRecord.clock_out) {
                                  const [outHours, outMinutes, outSeconds] = todayRecord.clock_out.split(':').map(Number);
                                  clockOutDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), outHours, outMinutes, outSeconds || 0);
                                } else {
                                  // If still working, use current time
                                  clockOutDate = new Date();
                                }

                                const totalSeconds = Math.floor((clockOutDate.getTime() - clockInDate.getTime()) / 1000);
                                const hours = Math.floor(totalSeconds / 3600);
                                const minutes = Math.floor((totalSeconds % 3600) / 60);

                                return `${hours}h ${minutes}m`;
                              })()}
                            </Text>
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {/* Clock In Time */}
                    {todayRecord && todayRecord.clock_in && (
                      <div style={{ textAlign: 'center', marginBottom: 12, padding: '8px', backgroundColor: '#f6ffed', borderRadius: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Since Last Login</Text>
                        <br />
                        <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                          {(() => {
                            if (!todayRecord?.clock_in) return '0h:0m';

                            // Create Date objects for today with the stored times
                            const today = new Date();
                            const [inHours, inMinutes, inSeconds] = todayRecord.clock_in.split(':').map(Number);
                            const clockInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), inHours, inMinutes, inSeconds || 0);

                            let clockOutDate;
                            if (todayRecord.clock_out) {
                              const [outHours, outMinutes, outSeconds] = todayRecord.clock_out.split(':').map(Number);
                              clockOutDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), outHours, outMinutes, outSeconds || 0);
                            } else {
                              clockOutDate = new Date();
                            }

                            const totalSeconds = Math.floor((clockOutDate.getTime() - clockInDate.getTime()) / 1000);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);

                            return `${hours}h:${minutes}m`;
                          })()}
                        </Text>
                      </div>
                    )}

                    {/* Time Details */}
                    <div style={{ marginTop: 16 }}>
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>ELAPSED TIME</Text>
                          <br />
                          <Text strong style={{ fontSize: 18, color: isClockedIn ? '#52c41a' : '#666' }}>
                            {(() => {
                              const hours = Math.floor(elapsedTime / 3600);
                              const minutes = Math.floor((elapsedTime % 3600) / 60);
                              const seconds = elapsedTime % 60;
                              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            })()}
                          </Text>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>STATUS</Text>
                          <br />
                          <Text strong style={{ color: isClockedIn ? '#52c41a' : '#ff4d4f' }}>
                            {isClockedIn ? 'ðŸŸ¢ Active' : 'ðŸ”´ Inactive'}
                          </Text>
                        </Col>
                        {todayRecord && (
                          <>
                            <Col span={12}>
                              <Text type="secondary" style={{ fontSize: 11 }}>CLOCK IN</Text>
                              <br />
                              <Text strong>{todayRecord.clock_in ? (() => {
                                const [hours, minutes, seconds] = todayRecord.clock_in.split(':').map(Number);
                                const period = hours >= 12 ? 'PM' : 'AM';
                                const displayHours = hours % 12 || 12;
                                return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
                              })() : '--:--:--'}</Text>
                            </Col>
                            <Col span={12}>
                              <Text type="secondary" style={{ fontSize: 11 }}>CLOCK OUT</Text>
                              <br />
                              <Text strong>{todayRecord.clock_out ? (() => {
                                const [hours, minutes, seconds] = todayRecord.clock_out.split(':').map(Number);
                                const period = hours >= 12 ? 'PM' : 'AM';
                                const displayHours = hours % 12 || 12;
                                return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
                              })() : '--:--:--'}</Text>
                            </Col>
                          </>
                        )}
                      </Row>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ marginTop: 16 }}>
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <Button
                          type="link"
                          icon={<HomeOutlined />}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={showWfhModal}
                          disabled={isClockedIn}
                        >
                          Work From Home
                        </Button>
                        {/* Work From Home Modal (Multi-Day) */}
                        <Modal
                          title="Work From Home Request (Multi-Day)"
                          open={wfhModalVisible}
                          onOk={handleWfhConfirm}
                          onCancel={() => {
                            setWfhModalVisible(false);
                            setWfhDates([]);
                            setWfhReason('');
                          }}
                          okText="Submit Request"
                          confirmLoading={wfhLoading}
                          width={500}
                        >
                          <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div>
                              <Typography.Text strong>Select Dates:</Typography.Text>
                              <Calendar
                                fullscreen={false}
                                dateFullCellRender={date => {
                                  const dateStr = date.format('YYYY-MM-DD');
                                  const selected = wfhDates.includes(dateStr);
                                  return (
                                    <div
                                      style={{
                                        background: selected ? '#1890ff' : undefined,
                                        color: selected ? '#fff' : undefined,
                                        borderRadius: 6,
                                        padding: 2,
                                        cursor: 'pointer',
                                      }}
                                      onClick={() => {
                                        if (selected) {
                                          setWfhDates(wfhDates.filter(d => d !== dateStr));
                                        } else {
                                          setWfhDates([...wfhDates, dateStr]);
                                        }
                                      }}
                                    >
                                      {date.date()}
                                    </div>
                                  );
                                }}
                              />
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Click on dates to select/deselect. Selected: {wfhDates.length}
                              </Typography.Text>
                            </div>
                            <div>
                              <Typography.Text>Reason:</Typography.Text>
                              <Input.TextArea
                                rows={3}
                                placeholder="Enter reason for WFH..."
                                value={wfhReason}
                                onChange={e => setWfhReason(e.target.value)}
                                style={{ marginTop: 8 }}
                              />
                            </div>
                          </Space>
                        </Modal>
                        <Button
                          type="link"
                          icon={<FileTextOutlined />}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={() => message.info('On Duty request feature coming soon!')}
                        >
                          On Duty
                        </Button>
                        <Button
                          type="link"
                          icon={<ClockCircleOutlined />}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={showPartialDayModal}
                        >
                          Partial Day Request
                        </Button>
                        <Button
                          type="link"
                          icon={<ReadOutlined />}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={showPolicyModal}
                        >
                          Attendance Policy
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Logs & Requests Section */}
              <Card
                title={<strong>Logs & Requests</strong>}
                bordered={false}
                extra={
                  <Space>
                    <Button type="primary">30 DAYS</Button>
                    <Button type="text">NOV</Button>
                    <Button type="text">OCT</Button>
                    <Button type="text">SEP</Button>
                    <Button type="text">AUG</Button>
                    <Button type="text">JUL</Button>
                    <Button type="text">JUN</Button>
                  </Space>
                }
              >
                {/* Tabs */}
                <div style={{ borderBottom: '2px solid #f0f0f0', marginBottom: 16 }}>
                  <Space size={32}>
                    <Button type="link" style={{ fontWeight: 'bold', color: '#1890ff', borderBottom: '2px solid #1890ff' }}>
                      Attendance Log
                    </Button>
                    <Button type="link" style={{ color: '#666' }}>Calendar</Button>
                    <Button type="link" style={{ color: '#666' }}>Attendance Requests</Button>
                  </Space>
                </div>

                <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>Last 30 Days</Text>

                <Table
                  dataSource={attendanceData?.records || []}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    {
                      title: 'DATE',
                      dataIndex: 'date',
                      key: 'date',
                      width: 180,
                      render: (date: string, record: any) => {
                        const d = new Date(date);
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                        return (
                          <div>
                            <Text strong>{dayName}, {dateStr}</Text>
                            {record.session_count > 1 && (
                              <div>
                                <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                                  {record.session_count} Sessions
                                </Tag>
                              </div>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'ATTENDANCE VISUAL',
                      key: 'visual',
                      width: 300,
                      render: (_: any, record: any) => {
                        if (!record.clock_in) return <Text type="secondary">-</Text>;

                        const clockIn = record.clock_in;
                        const clockOut = record.clock_out;

                        // Calculate position and width for visual bar
                        const startHour = parseInt(clockIn.split(':')[0]);
                        const startMin = parseInt(clockIn.split(':')[1]);
                        const startPercent = ((startHour * 60 + startMin) / (24 * 60)) * 100;

                        let endPercent = 100;
                        if (clockOut) {
                          const endHour = parseInt(clockOut.split(':')[0]);
                          const endMin = parseInt(clockOut.split(':')[1]);
                          endPercent = ((endHour * 60 + endMin) / (24 * 60)) * 100;
                        }

                        const width = endPercent - startPercent;

                        return (
                          <div style={{ position: 'relative', height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: `${startPercent}%`,
                                width: `${width}%`,
                                height: '100%',
                                backgroundColor: clockOut ? '#52c41a' : '#1890ff',
                                borderRadius: 4
                              }}
                            />
                            {record.notes?.includes('Late') && (
                              <div style={{ position: 'absolute', left: `${startPercent - 2}%`, top: -2 }}>
                                <WarningOutlined style={{ fontSize: 16, color: '#faad14' }} />
                              </div>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'EFFECTIVE HOURS',
                      dataIndex: 'working_hours',
                      key: 'effective_hours',
                      width: 120,
                      render: (hours: string, record: any) => {
                        if (record.status === 'absent' || !record.clock_in) return <Text>-</Text>;

                        let totalMinutes = 0;

                        if (record.has_active_session && record.clock_in) {
                          // Active Session: Calculate live time from clock_in
                          const [h, m] = record.clock_in.split(':').map(Number);
                          const clockInDates = new Date();
                          clockInDates.setHours(h, m, 0, 0);
                          const now = new Date();
                          totalMinutes = Math.floor((now.getTime() - clockInDates.getTime()) / 60000);
                        } else {
                          // Completed Day: Use total_minutes from DB
                          totalMinutes = record.total_minutes || 0;
                        }

                        const displayHours = Math.floor(Math.max(0, totalMinutes) / 60);
                        const displayMinutes = Math.max(0, totalMinutes) % 60;

                        return (
                          <Text style={{ color: record.has_active_session ? '#52c41a' : undefined }}>
                            {displayHours}h {displayMinutes}m
                          </Text>
                        );
                      }
                    },
                    {
                      title: 'GROSS HOURS',
                      dataIndex: 'working_hours',
                      key: 'gross_hours',
                      width: 120,
                      render: (hours: string, record: any) => {
                        if (record.status === 'absent' || !record.clock_in) return <Text>-</Text>;

                        let totalMinutes = 0;

                        // Gross = Clock Out - Clock In (simple diff)
                        // If Active: Now - Clock In
                        const [inH, inM] = record.clock_in.split(':').map(Number);
                        const start = new Date();
                        start.setUTCHours(inH, inM, 0, 0);

                        let end = new Date(); // Default to Now if active

                        if (record.clock_out) {
                          const [outH, outM] = record.clock_out.split(':').map(Number);
                          end.setUTCHours(outH, outM, 0, 0);
                        }

                        totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);

                        const displayHours = Math.floor(Math.max(0, totalMinutes) / 60);
                        const displayMinutes = Math.max(0, totalMinutes) % 60;

                        return (
                          <Text style={{ color: record.has_active_session ? '#1890ff' : undefined }}>
                            {displayHours}h {displayMinutes}m
                          </Text>
                        );
                      }
                    },
                    {
                      title: 'ARRIVAL',
                      key: 'arrival',
                      width: 120,
                      render: (_: any, record: any) => {
                        if (record.status === 'absent') return <Text>-</Text>;
                        const isLate = record.sessions?.some((s: any) => s.notes?.includes('Late'));
                        const lateNote = record.sessions?.find((s: any) => s.notes?.includes('Late'))?.notes;
                        return (
                          <div>
                            {isLate ? <FrownOutlined style={{ fontSize: 18, color: '#faad14' }} /> : <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />}
                            {isLate && lateNote && (
                              <>
                                <br />
                                <Text type="danger" style={{ fontSize: 11 }}>
                                  {lateNote.match(/\d+/)?.[0] || '0'} min late
                                </Text>
                              </>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'LOG',
                      key: 'log',
                      width: 60,
                      render: (_: any, record: any) => (
                        <Button
                          type="text"
                          icon={<InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />}
                          onClick={() => fetchDayDetails(record.date)}
                        />
                      )
                    }
                  ]}
                />
              </Card>

              {/* Detailed Day Log Drawer */}
              <Drawer
                title={
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      Attendance Details
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedDayDetails?.date && new Date(selectedDayDetails.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </div>
                }
                placement="right"
                width={450}
                open={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                loading={detailsLoading}
              >
                {selectedDayDetails && (
                  <div>
                    {/* Summary */}
                    <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
                      <Row gutter={8}>
                        <Col span={8}>
                          <Text type="secondary" style={{ fontSize: 11 }}>EFFECTIVE HOURS</Text>
                          <br />
                          <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                            8:00
                          </Text>
                        </Col>
                        <Col span={8}>
                          <Text type="secondary" style={{ fontSize: 11 }}>GROSS HOURS</Text>
                          <br />
                          <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                            9:00
                          </Text>
                        </Col>
                        <Col span={8}>
                          <Text type="secondary" style={{ fontSize: 11 }}>ENTRIES</Text>
                          <br />
                          <Text strong style={{ fontSize: 16 }}>
                            {selectedDayDetails.entry_count}
                          </Text>
                        </Col>
                      </Row>
                    </Card>

                    <Divider>
                      <Text strong>Clock In/Out Log</Text>
                    </Divider>

                    {/* Timeline of entries */}
                    <Timeline
                      items={selectedDayDetails.entries.map((entry: any, index: number) => {
                        try {
                          const location = entry.location ? JSON.parse(entry.location) : null;
                          return {
                            color: entry.clock_out ? 'green' : 'blue',
                            children: (
                              <div style={{ marginBottom: 16 }}>
                                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                                  {/* Clock In */}
                                  <Row align="middle" style={{ marginBottom: 8 }}>
                                    <Col span={4}>
                                      <LoginOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                                    </Col>
                                    <Col span={10}>
                                      <Text strong>
                                        {(() => {
                                          const [h, m, s] = entry.clock_in.split(':').map(Number);
                                          const d = new Date();
                                          d.setUTCHours(h, m, s || 0);
                                          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                        })()}
                                      </Text>
                                      <br />
                                      <Text type="secondary" style={{ fontSize: 11 }}>Clock In (Local)</Text>
                                    </Col>
                                    <Col span={10}>
                                      {location && (
                                        <a
                                          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ fontSize: 11 }}
                                        >
                                          <EnvironmentOutlined /> View Location
                                        </a>
                                      )}
                                    </Col>
                                  </Row>

                                  {/* Clock Out */}
                                  {entry.clock_out ? (
                                    <Row align="middle" style={{ marginBottom: 8 }}>
                                      <Col span={4}>
                                        <LogoutOutlined style={{ fontSize: 18, color: '#f5222d' }} />
                                      </Col>
                                      <Col span={10}>
                                        <Text strong>
                                          {(() => {
                                            const [h, m, s] = entry.clock_out.split(':').map(Number);
                                            const d = new Date();
                                            d.setUTCHours(h, m, s || 0);
                                            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                          })()}
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 11 }}>Clock Out (Local)</Text>
                                      </Col>
                                      <Col span={10}>
                                        <Tag color="green">{entry.working_hours}</Tag>
                                      </Col>
                                    </Row>
                                  ) : (
                                    <Tag color="processing">Currently Active</Tag>
                                  )}

                                  {/* Notes */}
                                  {entry.notes && (
                                    <div style={{ marginTop: 8 }}>
                                      <Tag color={entry.notes.includes('Late') ? 'red' : 'default'}>
                                        {entry.notes}
                                      </Tag>
                                    </div>
                                  )}

                                  {/* Work Mode */}
                                  <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      Work Mode: <Tag color="blue">{entry.work_mode || 'Office'}</Tag>
                                    </Text>
                                  </div>
                                </Card>
                              </div>
                            )
                          };
                        } catch (error) {
                          return {
                            color: 'gray',
                            children: <Text>Error loading entry</Text>
                          };
                        }
                      })}
                    />

                    {/* Actions */}
                    <Divider />
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button
                        block
                        icon={<EditOutlined />}
                        type="primary"
                        onClick={handleRegularizeAttendance}
                      >
                        Regularize Attendance
                      </Button>
                      <Button
                        block
                        icon={<ClockCircleOutlined />}
                        onClick={showPartialDayModal}
                      >
                        Apply Partial Day
                      </Button>
                    </Space>
                  </div>
                )}
              </Drawer>

              {/* Regularization Request Modal */}
              <Modal
                title={
                  <Space>
                    <EditOutlined style={{ color: '#52c41a' }} />
                    <span>Regularize Attendance</span>
                  </Space>
                }
                open={regularizeModalVisible}
                onCancel={() => {
                  setRegularizeModalVisible(false);
                  regularizeForm.resetFields();
                }}
                onOk={() => regularizeForm.submit()}
                confirmLoading={regularizeLoading}
                okText="Submit Request"
                cancelText="Cancel"
                width={600}
              >
                <Form
                  form={regularizeForm}
                  layout="vertical"
                  onFinish={handleRegularizeSubmit}
                  style={{ marginTop: 24 }}
                >
                  <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <strong>Regularization Request</strong><br />
                      Use this form to request correction or regularization of your attendance record.
                      Your request will be sent to your manager for approval.
                    </Text>
                  </Card>

                  <Form.Item
                    name="date"
                    label="Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker
                      size="large"
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      disabledDate={(current) => {
                        // Disable future dates
                        return current && current > dayjs().endOf('day');
                      }}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="clock_in_time"
                        label="Clock In Time"
                        rules={[{ required: true, message: 'Please select clock in time' }]}
                      >
                        <TimePicker
                          size="large"
                          style={{ width: '100%' }}
                          format="HH:mm"
                          placeholder="Select time"
                          showNow={false}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="clock_out_time"
                        label="Clock Out Time"
                        rules={[{ required: true, message: 'Please select clock out time' }]}
                      >
                        <TimePicker
                          size="large"
                          style={{ width: '100%' }}
                          format="HH:mm"
                          placeholder="Select time"
                          showNow={false}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="reason"
                    label="Reason for Regularization"
                    rules={[
                      { required: true, message: 'Please provide a reason' },
                      { min: 20, message: 'Reason must be at least 20 characters' }
                    ]}
                  >
                    <TextArea
                      rows={5}
                      placeholder="Please provide a detailed reason for requesting attendance regularization. For example:
- Forgot to clock in/out
- System/network issues
- Emergency situation
- Device not available
- Other valid reasons..."
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  <div style={{ padding: '12px 16px', background: '#fff7e6', borderRadius: '8px', border: '1px solid #ffd591' }}>
                    <Text type="warning" style={{ fontSize: 13 }}>
                      <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                      <strong>Important:</strong> Your regularization request will be reviewed by your manager.
                      Please ensure all details are accurate. You will be notified via email once approved or rejected.
                    </Text>
                  </div>
                </Form>
              </Modal>

              {/* Partial Day Request Modal */}
              <Modal
                title="Partial Day Request"
                open={partialDayModalVisible}
                onOk={handlePartialDayConfirm}
                onCancel={() => {
                  setPartialDayModalVisible(false);
                  setPartialDayDate('');
                  setPartialStartTime('');
                  setPartialEndTime('');
                  setPartialDayReason('');
                }}
                okText="Submit Request"
                confirmLoading={partialDayLoading}
                okButtonProps={{ icon: <ClockCircleOutlined /> }}
                width={500}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>Submit a partial day request</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Request will be sent to admin for approval
                    </Text>
                  </div>
                  <div>
                    <Text>Date: <Text type="danger">*</Text></Text>
                    <Input
                      type="date"
                      value={partialDayDate}
                      onChange={(e) => setPartialDayDate(e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <Text>Start Time: <Text type="danger">*</Text></Text>
                    <Input
                      type="time"
                      value={partialStartTime}
                      onChange={(e) => setPartialStartTime(e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <Text>End Time: <Text type="danger">*</Text></Text>
                    <Input
                      type="time"
                      value={partialEndTime}
                      onChange={(e) => setPartialEndTime(e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <Text>Reason:</Text>
                    <Input.TextArea
                      rows={4}
                      placeholder="Enter reason for partial day..."
                      value={partialDayReason}
                      onChange={(e) => setPartialDayReason(e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#e6f7ff', padding: 12, borderRadius: 6, border: '1px solid #91d5ff' }}>
                    <Text style={{ fontSize: 12 }}>
                      â° Duration will be calculated automatically based on your start and end times
                    </Text>
                  </div>
                </Space>
              </Modal>
            </div>
          )}

          {selectedMenu === 'leave' && (
            <div>
              <LeaveDashboard
                leaveRequests={leaveRequests}
                loading={leaveLoading}
                leaveBalance={leaveBalance}
                onRequestLeave={() => {
                  setEditingLeave(null);
                  leaveForm.resetFields();
                  setLeaveModalVisible(true);
                }}
                onCancelLeave={handleCancelLeave}
                fetchData={fetchLeaveRequests}
                onRequestPolicy={showPolicyModal}
              />
              {/* Leave Request Modal */}
              <Modal
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <span>{editingLeave ? 'Edit Leave Request' : 'Request New Leave'}</span>
                  </Space>
                }
                open={leaveModalVisible}
                onCancel={() => {
                  setLeaveModalVisible(false);
                  setEditingLeave(null);
                  leaveForm.resetFields();
                }}
                onOk={() => leaveForm.submit()}
                confirmLoading={leaveLoading}
                okText={editingLeave ? 'Update' : 'Submit'}
                width={600}
              >
                <Form
                  form={leaveForm}
                  layout="vertical"
                  onFinish={handleLeaveSubmit}
                  style={{ marginTop: 24 }}
                >
                  <Form.Item
                    name="leave_type"
                    label="Leave Type"
                    rules={[{ required: true, message: 'Please select leave type' }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select leave type"
                    >
                      <Option value="sick">Sick Leave</Option>
                      <Option value="vacation">Vacation</Option>
                      <Option value="personal">Personal Leave</Option>
                      <Option value="emergency">Emergency Leave</Option>
                      <Option value="birthday">Birthday Leave</Option>
                      <Option value="anniversary">Marriage Anniversary Leave</Option>
                      <Option value="maternity">Maternity Leave</Option>
                      <Option value="paternity">Paternity Leave</Option>
                      <Option value="unpaid">Unpaid Leave</Option>
                      <Option value="comp_off">Comp Off</Option>
                      <Option value="overseas">Overseas Trip</Option>
                    </Select>
                  </Form.Item>

                  {(function () {
                    // Use top-level state
                    const selectedType = selectedLeaveType;
                    let suggestion = null;
                    let balanceText = null;

                    if (selectedType === 'birthday' || selectedType === 'anniversary') {
                      suggestion = "Special leave is a paid time off to observe an event, such as employee's birthday, marriage anniversary.";
                      const used = selectedType === 'birthday' ? leaveBalance?.birthday_leave_used : leaveBalance?.anniversary_leave_used;
                      balanceText = used ? `${selectedType === 'birthday' ? 'Birthday' : 'Anniversary'} Leave - Not Available` : `${selectedType === 'birthday' ? 'Birthday' : 'Anniversary'} Leave - Available`;
                    } else if (selectedType === 'comp_off') {
                      suggestion = "This leave type is used to provide additional leave for the work done by employee on off/extrawork/ etc. Infinite Balance.";
                      balanceText = "Comp Off - Infinite Balance";
                    } else if (selectedType === 'overseas') {
                      suggestion = "Avail after completion of 3 years.";
                      balanceText = "Overseas Trip - check eligibility";
                    } else if (selectedType === 'maternity') {
                      suggestion = "Maternity Benefit: Max 26 Weeks (182 Days). 8 weeks before delivery. From 7th month, WFH is treated as full day work. Eligibility: 36 days service.";
                      balanceText = "Maternity Leave - Max 90 days (paid)";
                    } else if (selectedType === 'paternity') {
                      suggestion = "Paternity Benefit: Max 15 Days. Applicable post delivery.";
                      balanceText = "Paternity Leave - Max 15 days";
                    } else if (['sick', 'vacation', 'personal'].includes(selectedType)) {
                      suggestion = "Paid leave suggestion as per available leave balance.";
                      if (leaveBalance) {
                        const available = leaveBalance.paid_leave_quota - leaveBalance.paid_leave_used;
                        balanceText = `Paid Leave Balance: ${available} / ${leaveBalance.paid_leave_quota}`;
                      }
                    }

                    if (suggestion) {
                      return (
                        <div style={{ marginBottom: 24 }}>
                          {balanceText && (
                            <div style={{ padding: '8px 12px', background: '#1f1f1f', border: '1px solid #303030', borderRadius: '4px 4px 0 0', color: '#e0e0e0', fontSize: '12px' }}>
                              {balanceText}
                            </div>
                          )}
                          <div style={{ padding: '12px', background: '#002c4c', border: '1px solid #0050b3', borderRadius: balanceText ? '0 0 4px 4px' : '4px', color: '#1890ff' }}>
                            {suggestion}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <Form.Item
                    name="dateRange"
                    label="Leave Period"
                    rules={[{ required: true, message: 'Please select leave dates' }]}
                  >
                    <RangePicker
                      size="large"
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      disabledDate={(current) => {
                        return current && current < dayjs().startOf('day');
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[
                      { required: true, message: 'Please provide a reason' },
                      { min: 10, message: 'Reason must be at least 10 characters' }
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Please provide a detailed reason for your leave request..."
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  <div style={{ padding: '12px 16px', background: '#f0f5ff', borderRadius: '8px' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      <strong>Note:</strong> Your leave request will be sent to your manager for approval.
                      You will be notified once it has been reviewed.
                    </Text>
                  </div>
                </Form>
              </Modal>
            </div>
          )}

          {selectedMenu === 'payroll' && (
            <Card title="My Payroll" bordered={false}>
              <Text>Payroll information coming soon...</Text>
            </Card>
          )}

          {selectedMenu === 'documents' && (
            <Card title="My Documents" bordered={false}>
              <Text>Document management coming soon...</Text>
            </Card>
          )}

          {selectedMenu === 'requests' && (
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>My Activity Requests</span>
                </Space>
              }
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchActivityRequests}
                  loading={activityRequestsLoading}
                >
                  Refresh
                </Button>
              }
            >
              <Table
                dataSource={activityRequests}
                loading={activityRequestsLoading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'Type',
                    dataIndex: 'type',
                    key: 'type',
                    width: 150,
                    render: (type) => {
                      if (type === 'wfh') {
                        return <Tag color="blue" icon={<HomeOutlined />}>Work From Home</Tag>;
                      } else if (type === 'partial') {
                        return <Tag color="orange" icon={<ClockCircleOutlined />}>Partial Day</Tag>;
                      }
                      return <Tag>{type}</Tag>;
                    }
                  },
                  {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    width: 120,
                    render: (date) => new Date(date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  },
                  {
                    title: 'Details',
                    key: 'details',
                    render: (_, record) => {
                      if (record.type === 'partial') {
                        return (
                          <div style={{ fontSize: 12 }}>
                            <div>{record.start_time} - {record.end_time}</div>
                            <Text type="secondary">Duration: {record.duration} hrs</Text>
                          </div>
                        );
                      }
                      return record.reason ? (
                        <Text style={{ fontSize: 12 }}>{record.reason.substring(0, 50)}{record.reason.length > 50 ? '...' : ''}</Text>
                      ) : '-';
                    }
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    width: 180,
                    render: (status, record: any) => (
                      <Space direction="vertical" size={0}>
                        {status === 'pending' && <Tag color="warning" icon={<ClockCircleOutlined />}>Pending</Tag>}
                        {status === 'approved' && <Tag color="success" icon={<CheckCircleOutlined />}>Approved</Tag>}
                        {status === 'rejected' && <Tag color="error" icon={<CloseOutlined />}>Rejected</Tag>}
                        {!['pending', 'approved', 'rejected'].includes(status) && <Tag>{status}</Tag>}
                        {status === 'rejected' && record.notes && (
                          <Tooltip title={record.notes}>
                            <Text type="danger" style={{ fontSize: 11, maxWidth: 150, display: 'block' }} ellipsis>
                              <ExclamationCircleOutlined /> {record.notes}
                            </Text>
                          </Tooltip>
                        )}
                      </Space>
                    )
                  },
                  {
                    title: 'Submitted',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    width: 150,
                    render: (date) => new Date(date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    width: 100,
                    render: (_, record) => (
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setSelectedRequest(record);
                          setRequestDetailsModalVisible(true);
                        }}
                      >
                        View
                      </Button>
                    )
                  }
                ]}
              />
            </Card>
          )}

          {selectedMenu === 'myteam' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Loading My Team..." /></div>}>
              <MyTeam />
            </Suspense>
          )}

          {selectedMenu === 'profile' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}>
              <ProfilePage />
            </Suspense>
          )}

          {selectedMenu === 'settings' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}>
              <Settings />
            </Suspense>
          )}
        </Content>
      </Layout>

      {/* Clock In Modal */}
      <Modal
        title="Clock In"
        open={clockInModalVisible}
        onOk={handleClockInConfirm}
        onCancel={() => {
          setClockInModalVisible(false);
          setClockInNotes('');
        }}
        okText="Confirm Clock In"
        confirmLoading={loading}
        width={500}
      >
        <Space vertical style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>You are about to clock in</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </div>
          <div>
            <Text>Add notes (optional):</Text>
            <Input.TextArea
              rows={4}
              placeholder="Enter any notes about your work today..."
              value={clockInNotes}
              onChange={(e) => setClockInNotes(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ backgroundColor: '#f0f5ff', padding: 12, borderRadius: 6 }}>
            <Text style={{ fontSize: 12 }}>
              ðŸ“ Your location will be tracked for security purposes
            </Text>
          </div>
        </Space>
      </Modal>

      {/* Clock Out Modal */}
      <Modal
        title="Clock Out"
        open={clockOutModalVisible}
        onOk={handleClockOutConfirm}
        onCancel={() => {
          setClockOutModalVisible(false);
          setClockOutNotes('');
        }}
        okText="Confirm Clock Out"
        confirmLoading={loading}
        okButtonProps={{ danger: true }}
        width={500}
      >
        <Space vertical style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>You are about to clock out</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </div>
          {todayRecord && todayRecord.clock_in && (
            <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>CLOCK IN</Text>
                  <br />
                  <Text strong>{todayRecord.clock_in}</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>ELAPSED TIME</Text>
                  <br />
                  <Text strong style={{ color: '#52c41a' }}>
                    {(() => {
                      const hours = Math.floor(elapsedTime / 3600);
                      const minutes = Math.floor((elapsedTime % 3600) / 60);
                      const seconds = elapsedTime % 60;
                      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                    })()}
                  </Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>WILL BE</Text>
                  <br />
                  <Text strong>
                    {(() => {
                      const hours = Math.floor(elapsedTime / 3600);
                      const minutes = Math.floor((elapsedTime % 3600) / 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </Text>
                </Col>
              </Row>
            </Card>
          )}
          <div>
            <Text>Add notes (optional):</Text>
            <Input.TextArea
              rows={4}
              placeholder="Enter any notes about your work completion..."
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ backgroundColor: '#fff7e6', padding: 12, borderRadius: 6, border: '1px solid #ffd591' }}>
            <Text style={{ fontSize: 12 }}>
              â±ï¸ Your timer will stop after confirmation
            </Text>
          </div>
        </Space>
      </Modal>



      {/* Request Details Modal */}
      < Modal
        title="Request Details"
        open={requestDetailsModalVisible}
        onCancel={() => {
          setRequestDetailsModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={
          [
            <Button key="close" onClick={() => setRequestDetailsModalVisible(false)}>
              Close
            </Button>
          ]}
        width={600}
      >
        {selectedRequest && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Request Type">
              {selectedRequest.type === 'wfh' && (
                <Tag color="blue" icon={<HomeOutlined />}>Work From Home</Tag>
              )}
              {selectedRequest.type === 'partial' && (
                <Tag color="orange" icon={<ClockCircleOutlined />}>Partial Day</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {new Date(selectedRequest.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </Descriptions.Item>
            {selectedRequest.type === 'partial' && (
              <>
                <Descriptions.Item label="Start Time">
                  {selectedRequest.start_time}
                </Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {selectedRequest.end_time}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {selectedRequest.duration} hours
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Reason">
              {selectedRequest.reason || 'No reason provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {selectedRequest.status === 'pending' && (
                <Tag color="warning" icon={<ClockCircleOutlined />}>Pending Approval</Tag>
              )}
              {selectedRequest.status === 'approved' && (
                <Tag color="success" icon={<CheckCircleOutlined />}>Approved</Tag>
              )}
              {selectedRequest.status === 'rejected' && (
                <Tag color="error" icon={<CloseOutlined />}>Rejected</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted At">
              {new Date(selectedRequest.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Descriptions.Item>
            {selectedRequest.approval_date && (
              <Descriptions.Item label="Decision Date">
                {new Date(selectedRequest.approval_date).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Descriptions.Item>
            )}
            {selectedRequest.notes && (
              <Descriptions.Item label={selectedRequest.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}>
                <div style={{
                  backgroundColor: selectedRequest.status === 'rejected' ? '#fff1f0' : '#f6ffed',
                  padding: 12,
                  borderRadius: 4,
                  border: `1px solid ${selectedRequest.status === 'rejected' ? '#ffa39e' : '#b7eb8f'}`,
                  color: selectedRequest.status === 'rejected' ? '#cf1322' : 'inherit'
                }}>
                  {selectedRequest.status === 'rejected' && (
                    <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                  )}
                  {selectedRequest.notes}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal >
      <Modal
        title="Company Leave Policy & Holidays"
        open={policyModalVisible}
        onCancel={() => setPolicyModalVisible(false)}
        footer={[<Button key="close" onClick={() => setPolicyModalVisible(false)}>Close</Button>]}
        width={800}
      >
        <Tabs items={[
          {
            key: 'guidelines',
            label: 'Guidelines',
            children: <div style={{ maxHeight: '60vh', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: policyText }} />
          },
          {
            key: 'holidays',
            label: 'Holiday Calendar',
            children: (
              <Table
                dataSource={holidays}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: 'Date', dataIndex: 'date', render: (d: string) => dayjs(d).format('DD MMM YYYY, dddd') },
                  { title: 'Holiday', dataIndex: 'name' },
                  { title: 'Type', dataIndex: 'is_optional', render: (opt: number) => opt ? <Tag color="orange">Optional</Tag> : <Tag color="green">Mandatory</Tag> }
                ]}
              />
            )
          }
        ]} />
      </Modal>
    </Layout>
  );
};


export default UserDashboard;
