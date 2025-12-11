import React, { useState } from 'react';
import { DollarSign, Download, FileText, TrendingUp, Calendar, CreditCard, Users } from 'lucide-react';

interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending' | 'processing';
  payDate: string;
  department: string;
}

export default function PayrollManagement() {
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [activeTab, setActiveTab] = useState<'overview' | 'payslips' | 'history'>('overview');

  const payrollRecords: PayrollRecord[] = [
    {
      id: '1',
      employeeName: 'Sarah Johnson',
      employeeId: 'EMP001',
      baseSalary: 8500,
      bonuses: 1000,
      deductions: 850,
      netSalary: 8650,
      status: 'paid',
      payDate: '2024-01-31',
      department: 'Engineering'
    },
    {
      id: '2',
      employeeName: 'Michael Chen',
      employeeId: 'EMP002',
      baseSalary: 7200,
      bonuses: 500,
      deductions: 720,
      netSalary: 6980,
      status: 'paid',
      payDate: '2024-01-31',
      department: 'Sales & Marketing'
    },
    {
      id: '3',
      employeeName: 'Emily Rodriguez',
      employeeId: 'EMP003',
      baseSalary: 6800,
      bonuses: 300,
      deductions: 680,
      netSalary: 6420,
      status: 'pending',
      payDate: '2024-01-31',
      department: 'Human Resources'
    },
    {
      id: '4',
      employeeName: 'David Kim',
      employeeId: 'EMP004',
      baseSalary: 7500,
      bonuses: 800,
      deductions: 750,
      netSalary: 7550,
      status: 'processing',
      payDate: '2024-01-31',
      department: 'Finance'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-full text-xs font-medium">Paid</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 rounded-full text-xs font-medium">Pending</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded-full text-xs font-medium">Processing</span>;
      default:
        return null;
    }
  };

  const totalPayroll = payrollRecords.reduce((sum, record) => sum + record.netSalary, 0);
  const totalBonuses = payrollRecords.reduce((sum, record) => sum + record.bonuses, 0);
  const totalDeductions = payrollRecords.reduce((sum, record) => sum + record.deductions, 0);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Payroll Overview
        </button>
        <button
          onClick={() => setActiveTab('payslips')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'payslips'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Salary Records
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Payroll</p>
                  <h3 className="text-2xl font-bold">${(totalPayroll / 1000).toFixed(1)}K</h3>
                  <p className="text-xs text-green-600 mt-1">↑ 3.2% vs last month</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Bonuses</p>
                  <h3 className="text-2xl font-bold">${(totalBonuses / 1000).toFixed(1)}K</h3>
                  <p className="text-xs text-green-600 mt-1">↑ 8.5% increase</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Deductions</p>
                  <h3 className="text-2xl font-bold">${(totalDeductions / 1000).toFixed(1)}K</h3>
                  <p className="text-xs text-muted-foreground mt-1">Tax & benefits</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
                  <FileText className="text-red-600 dark:text-red-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Employees Paid</p>
                  <h3 className="text-2xl font-bold">{payrollRecords.filter(r => r.status === 'paid').length}/{payrollRecords.length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <Users className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Department-wise Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">Department-wise Payroll</h3>
              <div className="space-y-4">
                {[
                  { dept: 'Engineering', amount: 342000, employees: 342, color: 'bg-blue-500' },
                  { dept: 'Sales & Marketing', amount: 198000, employees: 198, color: 'bg-green-500' },
                  { dept: 'Human Resources', amount: 54000, employees: 54, color: 'bg-purple-500' },
                  { dept: 'Finance', amount: 89000, employees: 89, color: 'bg-yellow-500' },
                  { dept: 'Operations', amount: 156000, employees: 156, color: 'bg-red-500' },
                ].map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                        <span className="text-sm font-medium">{dept.dept}</span>
                      </div>
                      <span className="text-sm font-semibold">${(dept.amount / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{dept.employees} employees</span>
                      <span>•</span>
                      <span>Avg: ${Math.round(dept.amount / dept.employees).toLocaleString()}</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${dept.color}`}
                        style={{ width: `${(dept.amount / 342000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">Payroll Trend</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Monthly payroll trend chart</p>
                  <p className="text-sm">Visualize payroll over time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslips Tab */}
      {activeTab === 'payslips' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="2024-01">January 2024</option>
              <option value="2023-12">December 2023</option>
              <option value="2023-11">November 2023</option>
            </select>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center gap-2">
                <FileText size={16} />
                Generate Payslips
              </button>
              <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm flex items-center gap-2">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Payroll Records Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Employee</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Employee ID</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Department</th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">Base Salary</th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">Bonuses</th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">Deductions</th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">Net Salary</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Status</th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.map(record => (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {record.employeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium">{record.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{record.employeeId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{record.department}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium">${record.baseSalary.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-600 font-medium">+${record.bonuses.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-red-600 font-medium">-${record.deductions.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-lg">${record.netSalary.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium flex items-center gap-1">
                            <FileText size={14} />
                            Payslip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Base Salary</p>
                <p className="text-2xl font-bold">${payrollRecords.reduce((s, r) => s + r.baseSalary, 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Bonuses</p>
                <p className="text-2xl font-bold text-green-600">${totalBonuses.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600">${totalDeductions.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Net Payroll</p>
                <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Recent Payment History</h3>
            <div className="space-y-4">
              {[
                { month: 'January 2024', amount: 485000, employees: 1247, date: '2024-01-31', status: 'completed' },
                { month: 'December 2023', amount: 472000, employees: 1238, date: '2023-12-31', status: 'completed' },
                { month: 'November 2023', amount: 468000, employees: 1225, date: '2023-11-30', status: 'completed' },
                { month: 'October 2023', amount: 465000, employees: 1210, date: '2023-10-31', status: 'completed' },
              ].map((record, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold">{record.month}</p>
                      <p className="text-sm text-muted-foreground">{record.employees} employees • Paid on {new Date(record.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${(record.amount / 1000).toFixed(0)}K</p>
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-full text-xs font-medium">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
