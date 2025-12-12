import React, { useState } from 'react';
import { Calendar, FileText } from 'lucide-react';
import AttendanceManagement from './AttendanceManagement';
import LeaveManagement from './LeaveManagement';

export default function AttendanceLeaveWrapper() {
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
