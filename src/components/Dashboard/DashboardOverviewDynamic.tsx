import React, { useEffect, useState } from 'react';
import StatsCard from './StatsCard';
import { Users, UserCheck, UserX, Clock, DollarSign, Briefcase, TrendingUp, CalendarDays, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  onLeave: number;
  absent: number;
  pendingLeaves: number;
  totalPayroll: number;
  avgPerformance: number;
}

interface Employee {
  id: number;
  status: string;
}

interface AttendanceRecord {
  status: string;
  attendance_date: string;
}

interface LeaveRecord {
  status: string;
}

interface PayrollRecord {
  net_salary: number;
  status: string;
}

interface RecentActivity {
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

interface Department {
  id: number;
  name: string;
  employeeCount?: number;
}

export default function DashboardOverviewDynamic() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    absent: 0,
    pendingLeaves: 0,
    totalPayroll: 0,
    avgPerformance: 4.2
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch all required data in parallel
      const [employeesRes, attendanceRes, leavesRes, payrollRes, departmentsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance'),
        fetch('/api/leaves'),
        fetch('/api/payroll'),
        fetch('/api/departments')
      ]);

      const employees = await employeesRes.json() as any;
      const attendance = await attendanceRes.json() as any;
      const leaves = await leavesRes.json() as any;
      const payroll = await payrollRes.json() as any;
      const depts = await departmentsRes.json() as any;

      // Calculate statistics
      const employeeData = employees.data || [];
      const attendanceData = attendance.data || [];
      const leaveData = leaves.data || [];
      const payrollData = payroll.data || [];
      const departmentData = depts.data || [];

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Calculate attendance stats for today
      const todayAttendance = attendanceData.filter((a: AttendanceRecord) =>
        a.attendance_date === today
      );
      const presentCount = todayAttendance.filter((a: AttendanceRecord) =>
        a.status === 'present' || a.status === 'late'
      ).length;
      const absentCount = todayAttendance.filter((a: AttendanceRecord) =>
        a.status === 'absent'
      ).length;

      // Calculate leave stats
      const onLeaveCount = todayAttendance.filter((a: AttendanceRecord) =>
        a.status === 'on-leave'
      ).length;
      const pendingLeavesCount = leaveData.filter((l: LeaveRecord) =>
        l.status === 'pending'
      ).length;

      // Calculate payroll
      const approvedPayroll = payrollData.filter((p: PayrollRecord) =>
        p.status === 'approved' || p.status === 'paid'
      );
      const totalPayrollAmount = approvedPayroll.reduce((sum: number, p: PayrollRecord) =>
        sum + (p.net_salary || 0), 0
      );

      // Count active employees
      const activeCount = employeeData.filter((e: Employee) =>
        e.status === 'active'
      ).length;

      // Count employees per department
      const departmentCounts: { [key: number]: number } = {};
      employeeData.forEach((emp: any) => {
        if (emp.department_id) {
          departmentCounts[emp.department_id] = (departmentCounts[emp.department_id] || 0) + 1;
        }
      });

      const departmentsWithCounts = departmentData.map((dept: Department) => ({
        ...dept,
        employeeCount: departmentCounts[dept.id] || 0
      }));

      setStats({
        totalEmployees: employeeData.length,
        activeEmployees: activeCount,
        presentToday: presentCount,
        onLeave: onLeaveCount,
        absent: absentCount,
        pendingLeaves: pendingLeavesCount,
        totalPayroll: totalPayrollAmount,
        avgPerformance: 4.2
      });

      setDepartments(departmentsWithCounts);

      // Generate recent activities
      const activities: RecentActivity[] = [];

      // Recent employee additions
      const recentEmployees = employeeData.slice(-3);
      recentEmployees.forEach((emp: any, index: number) => {
        activities.push({
          action: `${emp.first_name} ${emp.last_name} joined as ${emp.position}`,
          time: `${index + 1} day${index > 0 ? 's' : ''} ago`,
          type: 'success'
        });
      });

      // Recent leave approvals
      const recentLeaves = leaveData.filter((l: LeaveRecord) =>
        l.status === 'approved'
      ).slice(-2);
      recentLeaves.forEach((leave: any, index: number) => {
        activities.push({
          action: `Leave request approved`,
          time: `${index + 2} hours ago`,
          type: 'info'
        });
      });

      // Pending leaves as warnings
      if (pendingLeavesCount > 0) {
        activities.push({
          action: `${pendingLeavesCount} leave request${pendingLeavesCount > 1 ? 's' : ''} pending approval`,
          time: 'Now',
          type: 'warning'
        });
      }

      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const attendanceRate = stats.totalEmployees > 0
    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)
    : '0';

  const statsCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees.toString(),
      change: `${stats.activeEmployees} active`,
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const
    },
    {
      title: 'Present Today',
      value: stats.presentToday.toString(),
      change: `${attendanceRate}% attendance`,
      trend: stats.presentToday > (stats.totalEmployees * 0.9) ? 'up' as const : 'down' as const,
      icon: UserCheck,
      color: 'green' as const
    },
    {
      title: 'On Leave',
      value: stats.onLeave.toString(),
      change: `${stats.pendingLeaves} pending`,
      trend: stats.pendingLeaves > 0 ? 'up' as const : 'down' as const,
      icon: CalendarDays,
      color: 'yellow' as const
    },
    {
      title: 'Absent',
      value: stats.absent.toString(),
      change: `${((stats.absent / stats.totalEmployees) * 100).toFixed(1)}% of total`,
      trend: stats.absent > 5 ? 'up' as const : 'down' as const,
      icon: UserX,
      color: 'red' as const
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingLeaves.toString(),
      change: 'Leave requests',
      trend: stats.pendingLeaves > 0 ? 'up' as const : 'down' as const,
      icon: Clock,
      color: 'purple' as const
    },
    {
      title: 'Monthly Payroll',
      value: `$${(stats.totalPayroll / 1000).toFixed(1)}K`,
      change: `${stats.activeEmployees} employees`,
      trend: 'up' as const,
      icon: DollarSign,
      color: 'green' as const
    },
    {
      title: 'Departments',
      value: departments.length.toString(),
      change: 'Active departments',
      trend: 'up' as const,
      icon: Briefcase,
      color: 'blue' as const
    },
    {
      title: 'Avg Performance',
      value: `${stats.avgPerformance.toFixed(1)}/5`,
      change: 'Overall rating',
      trend: stats.avgPerformance >= 4.0 ? 'up' as const : 'down' as const,
      icon: TrendingUp,
      color: 'purple' as const
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Today's Attendance Summary</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={20} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Present</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{attendanceRate}%</p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={20} className="text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">On Leave</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  {((stats.onLeave / stats.totalEmployees) * 100).toFixed(1)}%
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <UserX size={20} className="text-red-600" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Absent</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {((stats.absent / stats.totalEmployees) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Employees</span>
                <span className="font-semibold">{stats.totalEmployees}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Active Employees</span>
                <span className="font-semibold text-green-600">{stats.activeEmployees}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="space-y-3">
            {departments.length > 0 ? (
              departments.map((dept, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500'];
                const color = colors[index % colors.length];
                return (
                  <div key={dept.id} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {dept.employeeCount || 0} employee{dept.employeeCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No departments found</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-left">
              <Users size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Add New Employee</p>
                <p className="text-xs text-muted-foreground">Onboard new team member</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors text-left">
              <UserCheck size={20} className="text-green-600" />
              <div>
                <p className="text-sm font-medium">Mark Attendance</p>
                <p className="text-xs text-muted-foreground">Record today's attendance</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors text-left">
              <Clock size={20} className="text-purple-600" />
              <div>
                <p className="text-sm font-medium">Review Leave Requests</p>
                <p className="text-xs text-muted-foreground">{stats.pendingLeaves} pending approval{stats.pendingLeaves !== 1 ? 's' : ''}</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors text-left">
              <DollarSign size={20} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium">Process Payroll</p>
                <p className="text-xs text-muted-foreground">Generate monthly payroll</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
