import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Eye, Filter, Download, Upload, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { baseUrl } from '../../lib/base-url';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department_id?: number;
  department_name?: string;
  employment_type?: string;
  status: string;
  join_date: string;
  base_salary?: number;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department_id: '',
    employment_type: 'full-time',
    status: 'active',
    join_date: new Date().toISOString().split('T')[0],
    base_salary: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/employees`);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      } else {
        console.error('Failed to fetch employees:', data.error);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/departments`);
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      } else {
        console.error('Failed to fetch departments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAddEmployee = async () => {
    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.position || !formData.join_date) {
        alert('Please fill in all required fields: First Name, Last Name, Email, Position, and Join Date');
        return;
      }

      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
      };

      const response = await fetch(`${baseUrl}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setShowAddDialog(false);
        resetForm();
        fetchEmployees();
        alert('Employee created successfully!');
      } else {
        alert(data.error || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Failed to create employee. Please try again.');
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : undefined,
      };

      const response = await fetch(`${baseUrl}/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setShowEditDialog(false);
        setSelectedEmployee(null);
        resetForm();
        fetchEmployees();
        alert('Employee updated successfully!');
      } else {
        alert(data.error || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to terminate this employee? This will set their status to "terminated".')) return;

    try {
      const response = await fetch(`${baseUrl}/api/employees/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchEmployees();
        alert('Employee terminated successfully');
      } else {
        alert(data.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department_id: employee.department_id?.toString() || '',
      employment_type: employee.employment_type || 'full-time',
      status: employee.status || 'active',
      join_date: employee.join_date || '',
      base_salary: employee.base_salary?.toString() || '',
      date_of_birth: employee.date_of_birth || '',
      gender: employee.gender || '',
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      zip_code: employee.zip_code || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department_id: '',
      employment_type: 'full-time',
      status: 'active',
      join_date: new Date().toISOString().split('T')[0],
      base_salary: '',
      date_of_birth: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' || emp.department_id?.toString() === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      'on-leave': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      terminated: 'bg-red-100 text-red-800 border-red-200',
    };
    return variants[status] || variants.active;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600 mt-1">Manage your workforce efficiently</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {employees.filter((e) => e.status === 'active').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">On Leave</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {employees.filter((e) => e.status === 'on-leave').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Departments</p>
                <p className="text-2xl font-bold text-purple-900">{departments.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-400"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-blue-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="border-blue-200">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <CardTitle className="text-blue-900">Employee Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or add a new employee</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50 border-b border-blue-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {employee.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.department_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadge(employee.status)}>
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(employee)}
                            className="text-blue-600 hover:bg-blue-100"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(employee)}
                            className="text-green-600 hover:bg-green-100"
                            title="Edit Employee"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:bg-red-100"
                            title="Terminate Employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-blue-900">Add New Employee</DialogTitle>
            <DialogDescription>Fill in the employee details below. Fields marked with * are required.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Personal Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-semibold text-blue-900 text-lg border-b border-blue-200 pb-2">
                Personal Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-blue-900">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="border-blue-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-blue-900">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="border-blue-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-blue-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-blue-900">
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-blue-200"
                placeholder="+1-234-567-8900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="text-blue-900">
                Date of Birth
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-blue-900">
                Gender
              </Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employment Information */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="font-semibold text-blue-900 text-lg border-b border-blue-200 pb-2">
                Employment Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-blue-900">
                Position <span className="text-red-500">*</span>
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="border-blue-200"
                required
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_id" className="text-blue-900">
                Department
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder={departments.length > 0 ? "Select department" : "No departments available"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 ? (
                    <SelectItem value="none" disabled>No departments available</SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {departments.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Please create departments first
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type" className="text-blue-900">
                Employment Type
              </Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
              >
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="join_date" className="text-blue-900">
                Join Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="join_date"
                type="date"
                value={formData.join_date}
                onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                className="border-blue-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary" className="text-blue-900">
                Base Salary (USD)
              </Label>
              <Input
                id="base_salary"
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                className="border-blue-200"
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-blue-900">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="font-semibold text-blue-900 text-lg border-b border-blue-200 pb-2">
                Address Information
              </h3>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-blue-900">
                Street Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="border-blue-200"
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-blue-900">
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="border-blue-200"
                placeholder="San Francisco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-blue-900">
                State
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="border-blue-200"
                placeholder="CA"
              />
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="font-semibold text-blue-900 text-lg border-b border-blue-200 pb-2">
                Emergency Contact
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name" className="text-blue-900">
                Contact Name
              </Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="border-blue-200"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone" className="text-blue-900">
                Contact Phone
              </Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                className="border-blue-200"
                placeholder="+1-234-567-8900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog - Similar structure with pre-filled values */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-blue-900">Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Personal Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-semibold text-blue-900 text-lg border-b border-blue-200 pb-2">
                Personal Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_first_name" className="text-blue-900">
                First Name
              </Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_last_name" className="text-blue-900">
                Last Name
              </Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email" className="text-blue-900">
                Email
              </Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_phone" className="text-blue-900">
                Phone
              </Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-blue-200"
              />
            </div>

            {/* Employment Information */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="font-semibold text-blue-900 text-lg border-b border-blue-200 pb-2">
                Employment Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_position" className="text-blue-900">
                Position
              </Label>
              <Input
                id="edit_position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_department_id" className="text-blue-900">
                Department
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_employment_type" className="text-blue-900">
                Employment Type
              </Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
              >
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_base_salary" className="text-blue-900">
                Base Salary
              </Label>
              <Input
                id="edit_base_salary"
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit_status" className="text-blue-900">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedEmployee(null);
                resetForm();
              }}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button onClick={handleEditEmployee} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Edit2 className="h-4 w-4 mr-2" />
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-blue-900">Employee Details</DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h3>
                    <p className="text-blue-600 font-medium">{selectedEmployee.position}</p>
                  </div>
                  <Badge className={getStatusBadge(selectedEmployee.status)}>{selectedEmployee.status}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Employee ID</p>
                  <p className="font-semibold text-blue-900">{selectedEmployee.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold text-blue-900">{selectedEmployee.department_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-blue-900">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-blue-900">{selectedEmployee.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employment Type</p>
                  <p className="font-semibold text-blue-900 capitalize">{selectedEmployee.employment_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Join Date</p>
                  <p className="font-semibold text-blue-900">{selectedEmployee.join_date || 'N/A'}</p>
                </div>
                {selectedEmployee.base_salary && (
                  <div>
                    <p className="text-sm text-gray-600">Base Salary</p>
                    <p className="font-semibold text-blue-900">
                      ${selectedEmployee.base_salary.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedEmployee.emergency_contact_name && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Emergency Contact</p>
                    <p className="font-semibold text-blue-900">
                      {selectedEmployee.emergency_contact_name}
                      {selectedEmployee.emergency_contact_phone && ` - ${selectedEmployee.emergency_contact_phone}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
