import React from 'react';
import StatsCard from './StatsCard';
import { Users, UserCheck, UserX, Clock, DollarSign, Briefcase, TrendingUp, CalendarDays } from 'lucide-react';

export default function DashboardOverview() {
  const stats = [
    {
      title: 'Total Employees',
      value: '1,247',
      change: '12% vs last month',
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const
    },
    {
      title: 'Present Today',
      value: '1,142',
      change: '91.6% attendance',
      trend: 'up' as const,
      icon: UserCheck,
      color: 'green' as const
    },
    {
      title: 'On Leave',
      value: '87',
      change: '5% decrease',
      trend: 'down' as const,
      icon: CalendarDays,
      color: 'yellow' as const
    },
    {
      title: 'Absent',
      value: '18',
      change: '2% increase',
      trend: 'up' as const,
      icon: UserX,
      color: 'red' as const
    },
    {
      title: 'Pending Approvals',
      value: '24',
      change: '8 new today',
      trend: 'up' as const,
      icon: Clock,
      color: 'purple' as const
    },
    {
      title: 'Monthly Payroll',
      value: '$485K',
      change: '3% vs last month',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'green' as const
    },
    {
      title: 'Open Positions',
      value: '15',
      change: '3 new this week',
      trend: 'up' as const,
      icon: Briefcase,
      color: 'blue' as const
    },
    {
      title: 'Avg Performance',
      value: '4.2/5',
      change: '0.3 improvement',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'purple' as const
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Attendance Overview</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
              <p>Attendance chart visualization</p>
              <p className="text-sm">Weekly attendance trends</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New employee onboarded', time: '10 min ago', type: 'success' },
              { action: 'Leave request approved', time: '1 hour ago', type: 'info' },
              { action: 'Payroll processed', time: '2 hours ago', type: 'success' },
              { action: 'Interview scheduled', time: '3 hours ago', type: 'info' },
              { action: 'Performance review due', time: '5 hours ago', type: 'warning' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="space-y-3">
            {[
              { dept: 'Engineering', count: 342, color: 'bg-blue-500' },
              { dept: 'Sales & Marketing', count: 198, color: 'bg-green-500' },
              { dept: 'Human Resources', count: 54, color: 'bg-purple-500' },
              { dept: 'Finance', count: 89, color: 'bg-yellow-500' },
              { dept: 'Operations', count: 156, color: 'bg-red-500' },
            ].map((dept, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{dept.dept}</span>
                  <span className="text-sm text-muted-foreground">{dept.count} employees</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {[
              { event: 'Team Building Event', date: 'Jan 25, 2024', attendees: 85 },
              { event: 'Annual Performance Review', date: 'Jan 30, 2024', attendees: 247 },
              { event: 'HR Training Workshop', date: 'Feb 5, 2024', attendees: 32 },
              { event: 'Company Town Hall', date: 'Feb 10, 2024', attendees: 1247 },
            ].map((event, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <CalendarDays size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="text-xs text-muted-foreground">{event.date}</p>
                  <p className="text-xs text-muted-foreground">{event.attendees} attendees</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
