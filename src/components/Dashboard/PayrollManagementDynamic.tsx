import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Edit, Trash2, Check, X, Download, Calendar, Users, TrendingUp, FileText } from 'lucide-react';

interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department_name: string;
  position: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  tax: number;
  net_salary: number;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at: string;
}

interface PayrollStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  paid: number;
  cancelled: number;
  total_base_salary: number;
  total_bonuses: number;
  total_deductions: number;
  total_tax: number;
  total_net_salary: number;
}

export default function PayrollManagementDynamic() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchPayroll();
    fetchStats();
    fetchEmployees();
  }, [filterStatus]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/payroll?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayrollRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/payroll?stats=true');
      const data = await response.json();

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
      const data = await response.json();

      if (data.success) {
        setEmployees(data.data.filter((emp: any) => emp.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddPayroll = async (formData: any) => {
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        fetchPayroll();
        fetchStats();
      } else {
        alert(data.error || 'Failed to create payroll record');
      }
    } catch (error) {
      console.error('Error creating payroll:', error);
      alert('Failed to create payroll record');
    }
  };

  const handleBulkGenerate = async (formData: any) => {
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, action: 'generate_bulk' })
      });

      const data = await response.json();

      if (data.success) {
        setShowBulkModal(false);
        fetchPayroll();
        fetchStats();
        alert(data.message);
      } else {
        alert(data.error || 'Failed to generate bulk payroll');
      }
    } catch (error) {
      console.error('Error generating bulk payroll:', error);
      alert('Failed to generate bulk payroll');
    }
  };

  const handleUpdatePayroll = async (formData: any) => {
    if (!selectedRecord) return;

    try {
      const response = await fetch(`/api/payroll/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        fetchPayroll();
        fetchStats();
      } else {
        alert(data.error || 'Failed to update payroll record');
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      alert('Failed to update payroll record');
    }
  };

  const handleDeletePayroll = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;

    try {
      const response = await fetch('/api/payroll', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();

      if (data.success) {
        fetchPayroll();
        fetchStats();
      } else {
        alert(data.error || 'Failed to delete payroll record');
      }
    } catch (error) {
      console.error('Error deleting payroll:', error);
      alert('Failed to delete payroll record');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        fetchPayroll();
        fetchStats();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredRecords = payrollRecords.filter(record =>
    record.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">Manage employee payroll and compensation</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            <Users className="w-4 h-4" />
            Bulk Generate
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Payroll
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
                <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{formatCurrency(stats.total_net_salary || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
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

      {/* Payroll Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Pay Period</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Base Salary</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Bonuses</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Deductions</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Tax</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Net Salary</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    No payroll records found
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
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p>{new Date(record.pay_period_start).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">to {new Date(record.pay_period_end).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(record.base_salary)}</td>
                    <td className="px-4 py-3 text-right text-sm text-green-600">{formatCurrency(record.bonuses)}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(record.deductions)}</td>
                    <td className="px-4 py-3 text-right text-sm text-orange-600">{formatCurrency(record.tax)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold">{formatCurrency(record.net_salary)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(record.id, 'pending')}
                            className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg transition-colors"
                            title="Submit"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {record.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(record.id, 'approved')}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {record.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(record.id, 'paid')}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
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
                        {record.status !== 'paid' && (
                          <button
                            onClick={() => handleDeletePayroll(record.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payroll Modal */}
      {showAddModal && (
        <PayrollModal
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPayroll}
        />
      )}

      {/* Edit Payroll Modal */}
      {showEditModal && selectedRecord && (
        <PayrollModal
          employees={employees}
          record={selectedRecord}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleUpdatePayroll}
        />
      )}

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <BulkGenerateModal
          onClose={() => setShowBulkModal(false)}
          onSubmit={handleBulkGenerate}
        />
      )}
    </div>
  );
}

// Payroll Modal Component
function PayrollModal({ employees, record, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    employee_id: record?.employee_id || '',
    pay_period_start: record?.pay_period_start || '',
    pay_period_end: record?.pay_period_end || '',
    pay_date: record?.pay_date || '',
    base_salary: record?.base_salary || 0,
    bonuses: record?.bonuses || 0,
    deductions: record?.deductions || 0,
    tax: record?.tax || 0,
    net_salary: record?.net_salary || 0,
    status: record?.status || 'draft',
    payment_method: record?.payment_method || '',
    notes: record?.notes || ''
  });

  useEffect(() => {
    // Auto-calculate net salary when values change
    const base = parseFloat(formData.base_salary.toString()) || 0;
    const bonus = parseFloat(formData.bonuses.toString()) || 0;
    const deduct = parseFloat(formData.deductions.toString()) || 0;
    const taxAmount = parseFloat(formData.tax.toString()) || 0;

    const netSalary = base + bonus - deduct - taxAmount;
    setFormData(prev => ({ ...prev, net_salary: netSalary }));
  }, [formData.base_salary, formData.bonuses, formData.deductions, formData.tax]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-heading font-bold">
            {record ? 'Edit Payroll' : 'Add Payroll Record'}
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
                onChange={(e) => {
                  const empId = e.target.value;
                  const emp = employees.find((e: any) => e.id === parseInt(empId));
                  setFormData({
                    ...formData,
                    employee_id: empId,
                    base_salary: emp?.base_salary || 0,
                    tax: (emp?.base_salary || 0) * 0.1 // Auto-calculate 10% tax
                  });
                }}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              >
                <option value="">Select Employee</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id}) - ${emp.base_salary}/month
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pay Period Start <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.pay_period_start}
                onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pay Period End <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.pay_period_end}
                onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pay Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.pay_date}
              onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Base Salary</label>
              <input
                type="number"
                step="0.01"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bonuses</label>
              <input
                type="number"
                step="0.01"
                value={formData.bonuses}
                onChange={(e) => setFormData({ ...formData, bonuses: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Deductions</label>
              <input
                type="number"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tax</label>
              <input
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Net Salary (Auto-calculated)</label>
            <input
              type="number"
              step="0.01"
              value={formData.net_salary}
              readOnly
              className="w-full px-3 py-2 bg-muted border border-input rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <input
                type="text"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
                placeholder="e.g., Bank Transfer, Check"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={3}
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
              {record ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bulk Generate Modal Component
function BulkGenerateModal({ onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    pay_period_start: '',
    pay_period_end: '',
    pay_date: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-heading font-bold">Bulk Generate Payroll</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate payroll records for all active employees
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Pay Period Start <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.pay_period_start}
              onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pay Period End <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.pay_period_end}
              onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pay Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.pay_date}
              onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This will create draft payroll records for all active employees based on their current base salary.
            </p>
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
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
