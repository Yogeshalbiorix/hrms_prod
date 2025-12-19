import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Avatar, Dropdown, Button, Typography, Space, Calendar, Badge, List, message, Table, Tag, Progress, Drawer, Timeline, Divider, Modal, Input, Spin, Form, DatePicker, Select, Descriptions, Tooltip, TimePicker } from 'antd';
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
  EditOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../Auth/AuthContext';
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

interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
  created_at: string;
}

export const UserDashboard: React.FC = () => {
  const { user, logout, verifySession } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('attendance');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [clockInModalVisible, setClockInModalVisible] = useState(false);
  const [clockOutModalVisible, setClockOutModalVisible] = useState(false);
  const [clockInNotes, setClockInNotes] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [is24HourFormat, setIs24HourFormat] = useState(true);

  // Work from home states
  const [wfhModalVisible, setWfhModalVisible] = useState(false);
  const [wfhDate, setWfhDate] = useState('');
  const [wfhReason, setWfhReason] = useState('');
  const [wfhLoading, setWfhLoading] = useState(false);

  // Partial day request states
  const [partialDayModalVisible, setPartialDayModalVisible] = useState(false);
  const [partialDayDate, setPartialDayDate] = useState('');
  const [partialStartTime, setPartialStartTime] = useState('');
  const [partialEndTime, setPartialEndTime] = useState('');
  const [partialDayReason, setPartialDayReason] = useState('');
  const [partialDayLoading, setPartialDayLoading] = useState(false);

  // Activity requests history states
  const [activityRequests, setActivityRequests] = useState<any[]>([]);
  const [activityRequestsLoading, setActivityRequestsLoading] = useState(false);
  const [requestDetailsModalVisible, setRequestDetailsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // My Team states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<any>(null);
  const [teamLoading, setTeamLoading] = useState(false);

  // Leave request states
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [leaveForm] = Form.useForm();

  // Regularization states
  const [regularizeModalVisible, setRegularizeModalVisible] = useState(false);
  const [regularizeLoading, setRegularizeLoading] = useState(false);
  const [regularizeForm] = Form.useForm();
  const [regularizeDate, setRegularizeDate] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Force refresh user data on mount to ensure employee_id is up to date
  useEffect(() => {
    verifySession().then(() => {
      console.log('User data refreshed on dashboard mount');
    }).catch((error) => {
      console.error('Error refreshing user data:', error);
    });
  }, []);

  // Fetch activity requests when the requests tab is selected
  useEffect(() => {
    if (selectedMenu === 'requests') {
      fetchActivityRequests();
    }
  }, [selectedMenu]);

  // Timer for elapsed time since clock-in
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isClockedIn && todayRecord?.clock_in) {
      interval = setInterval(() => {
        const clockInTime = todayRecord.clock_in;
        const [hours, minutes, seconds] = clockInTime.split(':').map(Number);
        const clockInDate = new Date();
        clockInDate.setHours(hours, minutes, seconds, 0);

        const now = new Date();
        const diff = Math.floor((now.getTime() - clockInDate.getTime()) / 1000);
        setElapsedTime(diff > 0 ? diff : 0);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, todayRecord]);

  const fetchAttendanceData = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/attendance/my-attendance', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: any; error?: string };
      if (result.success) {
        setAttendanceData(result.data);
        setTodayRecord(result.data.today);
        // User is clocked in if: 1) today record exists, 2) has clock_in time, 3) no clock_out time yet
        setIsClockedIn(result.data.today && result.data.today.clock_in && !result.data.today.clock_out);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    if (!user?.employee_id) {
      console.error('Employee ID not found in user object:', user);
      message.error('Employee ID not found. Please log out and log back in.');
      setLeaveLoading(false);
      return;
    }

    setLeaveLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/leaves?employee_id=${user.employee_id}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as { success: boolean; data?: LeaveRequest[]; error?: string };
      if (result.success) {
        setLeaveRequests(result.data || []);
      } else {
        message.error(result.error || 'Failed to fetch leave requests');
        console.error('API error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      message.error('Failed to load leave requests');
    } finally {
      setLeaveLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMenu === 'leave') {
      fetchLeaveRequests();
    }
  }, [selectedMenu]);

  const handleLeaveSubmit = async (values: any) => {
    try {
      setLeaveLoading(true);

      // Check if user has employee_id
      if (!user?.employee_id) {
        message.error('Employee ID not found. Please contact administrator.');
        console.error('User employee_id is missing:', user);
        return;
      }

      const [startDate, endDate] = values.dateRange;

      const totalDays = Math.ceil(
        (endDate.toDate().getTime() - startDate.toDate().getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      const sessionToken = localStorage.getItem('sessionToken');

      if (!sessionToken) {
        message.error('Session expired. Please login again.');
        console.error('Session token not found');
        return;
      }

      // Determine if we're editing or creating
      const isEditing = !!editingLeave;
      const url = isEditing ? `/api/leaves/${editingLeave.id}` : '/api/leaves';
      const method = isEditing ? 'PUT' : 'POST';

      const leaveData = {
        employee_id: user.employee_id,
        leave_type: values.leave_type,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        total_days: totalDays,
        reason: values.reason,
        status: 'pending'
      };

      console.log('Submitting leave request:', leaveData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(leaveData)
      });

      console.log('Leave API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Leave API error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          message.error(errorData.error || `Failed to ${isEditing ? 'update' : 'submit'} leave request`);
        } catch {
          message.error(`Server error: ${response.status}`);
        }
        return;
      }

      const result = await response.json() as { success: boolean; data?: any; error?: string; details?: string };

      console.log('Leave submission response:', result);

      if (result.success) {
        message.success(isEditing ? 'Leave request updated successfully!' : 'Leave request submitted successfully!');
        setLeaveModalVisible(false);
        setEditingLeave(null);
        leaveForm.resetFields();
        fetchLeaveRequests();
      } else {
        const errorMsg = result.details ? `${result.error}: ${result.details}` : result.error;
        message.error(errorMsg || `Failed to ${isEditing ? 'update' : 'submit'} leave request`);
        console.error('Leave submission failed:', result);
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      message.error(`Failed to ${editingLeave ? 'update' : 'submit'} leave request`);
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleEditLeave = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    leaveForm.setFieldsValue({
      leave_type: leave.leave_type,
      dateRange: [dayjs(leave.start_date), dayjs(leave.end_date)],
      reason: leave.reason
    });
    setLeaveModalVisible(true);
  };

  const handleRegularizeAttendance = () => {
    console.log('Regularize button clicked');
    console.log('Selected day details:', selectedDayDetails);

    if (!selectedDayDetails?.date) {
      console.error('No date selected');
      message.error('Please select a date first');
      return;
    }

    console.log('Setting up form with date:', selectedDayDetails.date);
    setRegularizeDate(selectedDayDetails.date);

    // Parse times from entries if available
    let clockInTime = null;
    let clockOutTime = null;

    if (selectedDayDetails.entries && selectedDayDetails.entries.length > 0) {
      const firstEntry = selectedDayDetails.entries[0];
      console.log('First entry:', firstEntry);

      if (firstEntry.clock_in) {
        clockInTime = dayjs(firstEntry.clock_in, 'HH:mm:ss');
      }
      if (firstEntry.clock_out) {
        clockOutTime = dayjs(firstEntry.clock_out, 'HH:mm:ss');
      }
    }

    console.log('Clock in time:', clockInTime);
    console.log('Clock out time:', clockOutTime);

    regularizeForm.setFieldsValue({
      date: dayjs(selectedDayDetails.date),
      clock_in_time: clockInTime,
      clock_out_time: clockOutTime,
    });

    console.log('Opening regularization modal');
    setRegularizeModalVisible(true);
  };

  const handleRegularizeSubmit = async (values: any) => {
    try {
      setRegularizeLoading(true);

      if (!user?.employee_id) {
        message.error('Employee ID not found. Please contact administrator.');
        return;
      }

      const sessionToken = localStorage.getItem('sessionToken');

      if (!sessionToken) {
        message.error('Session expired. Please login again.');
        return;
      }

      const requestData = {
        employee_id: user.employee_id,
        date: values.date.format('YYYY-MM-DD'),
        clock_in: values.clock_in_time?.format('HH:mm:ss'),
        clock_out: values.clock_out_time?.format('HH:mm:ss'),
        reason: values.reason
      };

      console.log('Submitting regularization request:', requestData);

      const response = await fetch('/api/requests/regularization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Regularization API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Regularization API error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          message.error(errorData.error || 'Failed to submit regularization request');
        } catch {
          message.error(`Server error: ${response.status}`);
        }
        return;
      }

      const result = await response.json() as { success: boolean; data?: any; error?: string; details?: string };

      console.log('Regularization submission response:', result);

      if (result.success) {
        message.success('Regularization request submitted successfully!');
        setRegularizeModalVisible(false);
        regularizeForm.resetFields();
        setDrawerVisible(false);
        fetchAttendanceData();
        if (selectedMenu === 'requests') {
          fetchActivityRequests();
        }
      } else {
        const errorMsg = result.details ? `${result.error}: ${result.details}` : result.error;
        message.error(errorMsg || 'Failed to submit regularization request');
        console.error('Regularization submission failed:', result);
      }
    } catch (error) {
      console.error('Error submitting regularization:', error);
      message.error('Failed to submit regularization request');
    } finally {
      setRegularizeLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId: number) => {
    Modal.confirm({
      title: 'Cancel Leave Request',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to cancel this leave request?',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const sessionToken = localStorage.getItem('sessionToken');
          const response = await fetch(`/api/leaves/${leaveId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ status: 'cancelled' })
          });

          const result = await response.json() as { success: boolean; error?: string };
          if (result.success) {
            message.success('Leave request cancelled successfully');
            fetchLeaveRequests();
          } else {
            message.error('Failed to cancel leave request');
          }
        } catch (error) {
          console.error('Error cancelling leave:', error);
          message.error('Failed to cancel leave request');
        }
      }
    });
  };

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
    const today = new Date().toISOString().split('T')[0];
    setWfhDate(today);
    setWfhModalVisible(true);
  };

  const handleWfhConfirm = async () => {
    if (!wfhDate) {
      message.error('Please select a date');
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
          date: wfhDate,
          reason: wfhReason || 'Working from home'
        })
      });
      const result = await response.json() as any;
      if (result.success) {
        message.success('Work from home request submitted successfully');
        setWfhModalVisible(false);
        setWfhDate('');
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

  // Partial day request handlers
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
    await logout();
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => setSelectedMenu('profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => setSelectedMenu('settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
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

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
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
                      Welcome back, {user?.full_name || user?.username}! 👋
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
                        {isClockedIn ? '🟢 Active' : '⚪ Not Clocked In'}
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
                            {isClockedIn ? '🟢 Working' : '⚪ Not Clocked In'}
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
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>Gross:</Text>
                            <Text strong style={{ fontSize: 14, color: '#52c41a', marginLeft: 4 }}>0h 0m</Text>
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
                            {isClockedIn ? '🟢 Active' : '🔴 Inactive'}
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
                          icon={<span>🏠</span>}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={showWfhModal}
                          disabled={isClockedIn}
                        >
                          Work From Home
                        </Button>
                        <Button
                          type="link"
                          icon={<span>📋</span>}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={() => message.info('On Duty request feature coming soon!')}
                        >
                          On Duty
                        </Button>
                        <Button
                          type="link"
                          icon={<span>⏰</span>}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={showPartialDayModal}
                        >
                          Partial Day Request
                        </Button>
                        <Button
                          type="link"
                          icon={<span>📜</span>}
                          style={{ padding: 0, height: 'auto', color: '#1890ff' }}
                          onClick={() => message.info('Attendance policy document will be available soon!')}
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
                                <span style={{ fontSize: 16 }}>⚠️</span>
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
                        // Effective hours = actual working time from working_hours field
                        if (record.status === 'absent' || !record.clock_in) return <Text>-</Text>;

                        // If still working (no clock out), calculate live time
                        if (record.has_active_session && record.clock_in) {
                          const [hours, minutes, seconds] = record.clock_in.split(':').map(Number);
                          const clockInDate = new Date();
                          clockInDate.setHours(hours, minutes, seconds || 0, 0);

                          const now = new Date();
                          const diffMs = now.getTime() - clockInDate.getTime();
                          const totalMins = Math.floor(diffMs / (1000 * 60));

                          const displayHours = Math.floor(totalMins / 60);
                          const displayMinutes = totalMins % 60;

                          return <Text style={{ color: '#52c41a' }}>{displayHours}h {displayMinutes}m</Text>;
                        }

                        // Use actual total_minutes from the record
                        const actualMinutes = record.total_minutes || 0;
                        const displayHours = Math.floor(actualMinutes / 60);
                        const displayMinutes = actualMinutes % 60;

                        return <Text>{displayHours}h {displayMinutes}m</Text>;
                      }
                    },
                    {
                      title: 'GROSS HOURS',
                      dataIndex: 'working_hours',
                      key: 'gross_hours',
                      width: 120,
                      render: (hours: string, record: any) => {
                        // Gross hours = total time from clock in to clock out (including breaks)
                        if (record.status === 'absent' || !record.clock_in) return <Text>-</Text>;

                        // If still working, calculate total elapsed time from clock in to now
                        if (record.has_active_session && record.clock_in) {
                          const [hours, minutes, seconds] = record.clock_in.split(':').map(Number);
                          const clockInDate = new Date();
                          clockInDate.setHours(hours, minutes, seconds || 0, 0);

                          const now = new Date();
                          const diffMs = now.getTime() - clockInDate.getTime();
                          const totalMins = Math.floor(diffMs / (1000 * 60));

                          const displayHours = Math.floor(totalMins / 60);
                          const displayMinutes = totalMins % 60;

                          return <Text style={{ color: '#1890ff' }}>{displayHours}h {displayMinutes}m</Text>;
                        }

                        // Calculate gross time from clock_in to clock_out
                        if (record.clock_in && record.clock_out) {
                          const [inHours, inMinutes, inSeconds] = record.clock_in.split(':').map(Number);
                          const [outHours, outMinutes, outSeconds] = record.clock_out.split(':').map(Number);

                          const clockInMins = inHours * 60 + inMinutes;
                          const clockOutMins = outHours * 60 + outMinutes;
                          const totalMins = clockOutMins - clockInMins;

                          const displayHours = Math.floor(totalMins / 60);
                          const displayMinutes = totalMins % 60;

                          return <Text>{displayHours}h {displayMinutes}m</Text>;
                        }

                        return <Text>-</Text>;
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
                            <span style={{ fontSize: 18 }}>{isLate ? '😟' : '✅'}</span>
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
                          icon={<span style={{ color: '#faad14', fontSize: 16 }}>ℹ️</span>}
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
                                      <span style={{ fontSize: 18 }}>✅</span>
                                    </Col>
                                    <Col span={10}>
                                      <Text strong>{entry.clock_in}</Text>
                                      <br />
                                      <Text type="secondary" style={{ fontSize: 11 }}>Clock In</Text>
                                    </Col>
                                    <Col span={10}>
                                      {location && (
                                        <a
                                          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ fontSize: 11 }}
                                        >
                                          📍 View Location
                                        </a>
                                      )}
                                    </Col>
                                  </Row>

                                  {/* Clock Out */}
                                  {entry.clock_out ? (
                                    <Row align="middle" style={{ marginBottom: 8 }}>
                                      <Col span={4}>
                                        <span style={{ fontSize: 18 }}>⏸️</span>
                                      </Col>
                                      <Col span={10}>
                                        <Text strong>{entry.clock_out}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 11 }}>Clock Out</Text>
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
                        icon={<span>✏️</span>}
                        type="primary"
                        onClick={handleRegularizeAttendance}
                      >
                        Regularize Attendance
                      </Button>
                      <Button
                        block
                        icon={<span>📋</span>}
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
                      ⏰ Duration will be calculated automatically based on your start and end times
                    </Text>
                  </div>
                </Space>
              </Modal>
            </div>
          )}

          {selectedMenu === 'leave' && (
            <div>
              {/* Leave Summary Stats */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Total Requests</span>}
                      value={leaveRequests.length}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Pending</span>}
                      value={leaveRequests.filter(l => l.status === 'pending').length}
                      prefix={<HourglassOutlined />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Approved</span>}
                      value={leaveRequests.filter(l => l.status === 'approved').length}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Total Days</span>}
                      value={leaveRequests
                        .filter(l => l.status === 'approved')
                        .reduce((sum, l) => sum + l.total_days, 0)}
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Request New Leave Button */}
              <Card style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => setLeaveModalVisible(true)}
                >
                  Request New Leave
                </Button>
              </Card>

              {/* Leave Requests Table */}
              <Card title="My Leave Requests" bordered={false}>
                <Table
                  dataSource={leaveRequests}
                  loading={leaveLoading}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Total ${total} requests`
                  }}
                  columns={[
                    {
                      title: 'Leave Type',
                      dataIndex: 'leave_type',
                      key: 'leave_type',
                      render: (type: string) => {
                        if (!type) return '-';
                        return (
                          <Tag color={getLeaveTypeColor(type)}>
                            {type.toUpperCase()}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Duration',
                      key: 'duration',
                      render: (_: any, record: LeaveRequest) => {
                        if (!record.start_date || !record.end_date) return '-';
                        return (
                          <Space direction="vertical" size={0}>
                            <Text strong>
                              {dayjs(record.start_date).format('MMM DD, YYYY')} - {dayjs(record.end_date).format('MMM DD, YYYY')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {record.total_days} day{record.total_days > 1 ? 's' : ''}
                            </Text>
                          </Space>
                        );
                      },
                    },
                    {
                      title: 'Reason',
                      dataIndex: 'reason',
                      key: 'reason',
                      ellipsis: true,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => {
                        if (!status) return '-';
                        return (
                          <Tag
                            color={getLeaveStatusColor(status)}
                            icon={
                              status === 'approved' ? <CheckCircleOutlined /> :
                                status === 'rejected' ? <CloseOutlined /> :
                                  status === 'pending' ? <ClockCircleOutlined /> :
                                    <CloseOutlined />
                            }
                          >
                            {status.toUpperCase()}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Applied On',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      render: (date: string) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
                      sorter: (a, b) => {
                        if (!a.created_at || !b.created_at) return 0;
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      },
                    },
                    {
                      title: 'Rejection Reason',
                      dataIndex: 'rejection_reason',
                      key: 'rejection_reason',
                      width: 200,
                      render: (reason: string, record: LeaveRequest) => {
                        if (record.status !== 'rejected' || !reason) return '-';
                        return (
                          <Tooltip title={reason}>
                            <Text type="danger" ellipsis style={{ maxWidth: 180 }}>
                              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                              {reason}
                            </Text>
                          </Tooltip>
                        );
                      },
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_: any, record: LeaveRequest) => (
                        <Space>
                          {record.status === 'pending' && (
                            <>
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEditLeave(record)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleCancelLeave(record.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {record.status === 'approved' && record.approved_by && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Approved by {record.approved_by}
                            </Text>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>

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
                    <Select size="large" placeholder="Select leave type">
                      <Option value="sick">Sick Leave</Option>
                      <Option value="vacation">Vacation</Option>
                      <Option value="personal">Personal Leave</Option>
                      <Option value="maternity">Maternity Leave</Option>
                      <Option value="paternity">Paternity Leave</Option>
                      <Option value="unpaid">Unpaid Leave</Option>
                    </Select>
                  </Form.Item>

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
              📍 Your location will be tracked for security purposes
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
              ⏱️ Your timer will stop after confirmation
            </Text>
          </div>
        </Space>
      </Modal>

      {/* Work From Home Modal */}
      <Modal
        title="Work From Home Request"
        open={wfhModalVisible}
        onOk={handleWfhConfirm}
        onCancel={() => {
          setWfhModalVisible(false);
          setWfhDate('');
          setWfhReason('');
        }}
        okText="Submit Request"
        confirmLoading={wfhLoading}
        okButtonProps={{ icon: <HomeOutlined /> }}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Submit a work from home request</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Request will be sent to admin for approval
            </Text>
          </div>
          <div>
            <Text>Date: <Text type="danger">*</Text></Text>
            <Input
              type="date"
              value={wfhDate}
              onChange={(e) => setWfhDate(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text>Reason:</Text>
            <Input.TextArea
              rows={4}
              placeholder="Enter reason for working from home..."
              value={wfhReason}
              onChange={(e) => setWfhReason(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ backgroundColor: '#e6f7ff', padding: 12, borderRadius: 6, border: '1px solid #91d5ff' }}>
            <Text style={{ fontSize: 12 }}>
              🏠 Your request will be submitted for admin approval
            </Text>
          </div>
        </Space>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        title="Request Details"
        open={requestDetailsModalVisible}
        onCancel={() => {
          setRequestDetailsModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={[
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
      </Modal>
    </Layout>
  );
};

export default UserDashboard;
