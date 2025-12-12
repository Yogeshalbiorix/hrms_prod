import React, { useState } from 'react';
import { Calendar, FileText } from 'lucide-react';
import AttendanceManagement from './AttendanceManagement';
import LeaveManagement from './LeaveManagement';

export default function AttendanceLeave() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-card border border-border rounded-lg p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md transition-all ${activeTab === 'attendance'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="font-medium">Attendance</span>
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md transition-all ${activeTab === 'leave'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span className="font-medium">Leave Management</span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'attendance' ? (
          <AttendanceManagement />
        ) : (
          <LeaveManagement />
        )}
      </div>
    </div>
  );
}
/*
  const leaveRequests: LeaveRequest[] = [
    {
      id: '1',
      employeeName: 'Sarah Johnson',
      leaveType: 'Sick Leave',
      startDate: '2024-01-25',
      endDate: '2024-01-27',
      days: 3,
      reason: 'Medical appointment and recovery',
      status: 'pending',
      appliedOn: '2024-01-20'
    },
    {
      id: '2',
      employeeName: 'Michael Chen',
      leaveType: 'Vacation',
      startDate: '2024-02-10',
      endDate: '2024-02-17',
      days: 8,
      reason: 'Family vacation',
      status: 'approved',
      appliedOn: '2024-01-15'
    },
    {
      id: '3',
      employeeName: 'Emily Rodriguez',
      leaveType: 'Personal Leave',
      startDate: '2024-01-22',
      endDate: '2024-01-22',
      days: 1,
      reason: 'Personal matters',
      status: 'approved',
      appliedOn: '2024-01-18'
    },
    {
      id: '4',
      employeeName: 'David Kim',
      leaveType: 'Sick Leave',
      startDate: '2024-01-28',
      endDate: '2024-01-29',
      days: 2,
      reason: 'Flu symptoms',
      status: 'pending',
      appliedOn: '2024-01-27'
    },
  ];

  const attendanceData = [
    { date: '2024-01-22', present: 1142, absent: 18, onLeave: 87, total: 1247 },
    { date: '2024-01-23', present: 1156, absent: 15, onLeave: 76, total: 1247 },
    { date: '2024-01-24', present: 1139, absent: 22, onLeave: 86, total: 1247 },
    { date: '2024-01-25', present: 1145, absent: 19, onLeave: 83, total: 1247 },
    { date: '2024-01-26', present: 1150, absent: 12, onLeave: 85, total: 1247 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertCircle size={12} /> Pending
        </span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle size={12} /> Approved
        </span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle size={12} /> Rejected
        </span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
<div className="flex gap-2 border-b border-border">
  <button
    onClick={() => setActiveTab('attendance')}
    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'attendance'
      ? 'border-primary text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
  >
    Attendance Overview
  </button>
  <button
    onClick={() => setActiveTab('leave')}
    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'leave'
      ? 'border-primary text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
  >
    Leave Requests
  </button>
</div>

{/* Attendance Tab */ }
{
  activeTab === 'attendance' && (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Present Today</p>
              <h3 className="text-2xl font-bold text-green-600">1,142</h3>
              <p className="text-xs text-muted-foreground mt-1">91.6%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">On Leave</p>
              <h3 className="text-2xl font-bold text-yellow-600">87</h3>
              <p className="text-xs text-muted-foreground mt-1">7.0%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
              <Calendar className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Absent</p>
              <h3 className="text-2xl font-bold text-red-600">18</h3>
              <p className="text-xs text-muted-foreground mt-1">1.4%</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Avg Check-in</p>
              <h3 className="text-2xl font-bold">8:47 AM</h3>
              <p className="text-xs text-green-600 mt-1">13 min early</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">Daily Attendance Log</h3>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="2024-01">January 2024</option>
              <option value="2023-12">December 2023</option>
              <option value="2023-11">November 2023</option>
            </select>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-sm">Date</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Present</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">On Leave</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Absent</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Total</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, index) => {
                const percentage = ((record.present / record.total) * 100).toFixed(1);
                return (
                  <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-600 font-semibold">{record.present}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-yellow-600 font-semibold">{record.onLeave}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-600 font-semibold">{record.absent}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{record.total}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar View Placeholder */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Monthly Calendar</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Calendar size={48} className="mx-auto mb-2 opacity-50" />
            <p>Calendar view with attendance markers</p>
            <p className="text-sm">Visual representation of daily attendance</p>
          </div>
        </div>
      </div>
    </div>
  )
}

{/* Leave Requests Tab */ }
{
  activeTab === 'leave' && (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex gap-3 items-center">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
          All Requests
        </button>
        <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm">
          Pending
        </button>
        <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm">
          Approved
        </button>
        <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm">
          Rejected
        </button>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-sm">Employee</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Leave Type</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Duration</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Days</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Reason</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Applied On</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map(request => (
                <tr key={request.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {request.employeeName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium">{request.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{request.leaveType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p>{new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-muted-foreground">to {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{request.days} days</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground max-w-xs truncate block">{request.reason}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{new Date(request.appliedOn).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4">
                    {request.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors text-sm font-medium">
                          Approve
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors text-sm font-medium">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h4 className="font-semibold mb-4">Leave Type Distribution</h4>
          <div className="space-y-3">
            {[
              { type: 'Sick Leave', count: 42, color: 'bg-red-500' },
              { type: 'Vacation', count: 28, color: 'bg-blue-500' },
              { type: 'Personal Leave', count: 17, color: 'bg-purple-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm">{item.type}</span>
                </div>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h4 className="font-semibold mb-4">Leave Balance Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Allocated</span>
              <span className="text-sm font-semibold">18,735 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Used</span>
              <span className="text-sm font-semibold">8,456 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="text-sm font-semibold">10,279 days</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h4 className="font-semibold mb-4">Request Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-sm font-semibold text-yellow-600">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Approved</span>
              <span className="text-sm font-semibold text-green-600">186</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rejected</span>
              <span className="text-sm font-semibold text-red-600">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
    </div >
  );
}
