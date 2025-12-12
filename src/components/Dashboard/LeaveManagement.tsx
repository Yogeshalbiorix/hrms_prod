import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Search, Edit, Trash2, Check, X, FileText } from 'lucide-react';

interface LeaveRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department_name: string;
  leave_type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approval_date?: string;
  notes?: string;
  created_at: string;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export default function LeaveManagement() {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LeaveRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLeaveType, setFilterLeaveType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaves();
    fetchStats();
    fetchEmployees();
  }, [filterStatus, filterLeaveType]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterLeaveType) params.append('leave_type', filterLeaveType);

      const response = await fetch(`/api/leaves?${params}`);
      const data = await response.json() as any;

      if (data.success) {
        setLeaveRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/leaves?stats=true');
      const data = await response.json() as any;

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json() as any;

      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddLeave = async (formData: any) => {
    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json() as any;

      if (data.success) {
        setShowAddModal(false);
        fetchLeaves();
        fetchStats();
      } else {
        alert(data.error || 'Failed to create leave request');
      }
    } catch (error) {
      console.error('Error creating leave:', error);
      alert('Failed to create leave request');
    }
  };

  const handleUpdateLeave = async (formData: any) => {
    if (!selectedRecord) return;

    try {
      const response = await fetch(`/api/leaves/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json() as any;

      if (data.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        fetchLeaves();
        fetchStats();
      } else {
        alert(data.error || 'Failed to update leave request');
      }
    } catch (error) {
      console.error('Error updating leave:', error);
      alert('Failed to update leave request');
    }
  };

  const handleDeleteLeave = async (id: number) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;

    try {
      const response = await fetch('/api/leaves', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json() as any;

      if (data.success) {
        fetchLeaves();
        fetchStats();
      } else {
        alert(data.error || 'Failed to delete leave request');
      }
    } catch (error) {
      console.error('Error deleting leave:', error);
      alert('Failed to delete leave request');
    }
  };

  const handleApproveReject = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approval_date: new Date().toISOString(),
          approved_by: 'Current User' // Replace with actual user
        })
      });

      const data = await response.json() as any;

      if (data.success) {
        fetchLeaves();
        fetchStats();
      } else {
        alert(data.error || 'Failed to update leave status');
      }
    } catch (error) {
      console.error('Error updating leave:', error);
      alert('Failed to update leave status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getLeaveTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'vacation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'personal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'maternity':
      case 'paternity':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredRecords = leaveRecords.filter(record =>
    record.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Manage employee leave requests</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Leave Request
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Leave Type</label>
            <select
              value={filterLeaveType}
              onChange={(e) => setFilterLeaveType(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            >
              <option value="">All Types</option>
              <option value="sick">Sick Leave</option>
              <option value="vacation">Vacation</option>
              <option value="personal">Personal</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or employee ID..."
                className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Leave Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Days</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{record.employee_name}</p>
                        <p className="text-sm text-muted-foreground">{record.employee_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{record.department_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeBadgeClass(record.leave_type)}`}>
                        {record.leave_type.charAt(0).toUpperCase() + record.leave_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(record.start_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">{new Date(record.end_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium">{record.total_days}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{record.reason || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveReject(record.id, 'approved')}
                              className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApproveReject(record.id, 'rejected')}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLeave(record.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Leave Modal */}
      {showAddModal && (
        <LeaveModal
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddLeave}
        />
      )}

      {/* Edit Leave Modal */}
      {showEditModal && selectedRecord && (
        <LeaveModal
          employees={employees}
          record={selectedRecord}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleUpdateLeave}
        />
      )}
    </div>
  );
}

// Leave Modal Component
function LeaveModal({ employees, record, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    employee_id: record?.employee_id || '',
    leave_type: record?.leave_type || 'vacation',
    start_date: record?.start_date || '',
    end_date: record?.end_date || '',
    reason: record?.reason || '',
    status: record?.status || 'pending',
    notes: record?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-heading font-bold">
            {record ? 'Edit Leave Request' : 'New Leave Request'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!record && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Employee <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              >
                <option value="">Select Employee</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Leave Type <span className="text-destructive">*</span>
            </label>
            <select
              required
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            >
              <option value="sick">Sick Leave</option>
              <option value="vacation">Vacation</option>
              <option value="personal">Personal</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              End Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={3}
              placeholder="Reason for leave..."
            />
          </div>

          {record && (
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {record ? 'Update' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
