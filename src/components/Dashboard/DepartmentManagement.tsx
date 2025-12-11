import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Users, Search, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { baseUrl } from '../../lib/base-url';

interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/departments`);
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      } else {
        console.error('Failed to fetch departments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    try {
      if (!formData.name.trim()) {
        alert('Please enter a department name');
        return;
      }

      const response = await fetch(`${baseUrl}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowAddDialog(false);
        resetForm();
        fetchDepartments();
        alert('Department created successfully!');
      } else {
        alert(data.error || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department. Please try again.');
    }
  };

  const handleDeleteDepartment = async (id: number, employeeCount: number) => {
    if (employeeCount > 0) {
      alert(`Cannot delete department with ${employeeCount} employee(s). Please reassign employees first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const response = await fetch(`${baseUrl}/api/departments?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchDepartments();
        alert('Department deleted successfully');
      } else {
        alert(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Department Management</h2>
          <p className="text-gray-600 mt-1">Organize and manage company departments</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Departments</p>
              <p className="text-3xl font-bold text-blue-900">{departments.length}</p>
              <p className="text-sm text-gray-600 mt-1">
                {departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0)} total employees across all departments
              </p>
            </div>
            <Building2 className="h-16 w-16 text-blue-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="border-blue-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Card className="border-blue-200">
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No departments found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? 'Try adjusting your search' : 'Create your first department to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <Card key={department.id} className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {department.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-100 h-8 w-8 p-0"
                      onClick={() => handleDeleteDepartment(department.id, department.employee_count || 0)}
                      title="Delete Department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {department.description && (
                  <p className="text-sm text-gray-600 mb-4">{department.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    {department.employee_count || 0}
                  </span>
                  <span className="text-gray-600">
                    {department.employee_count === 1 ? 'Employee' : 'Employees'}
                  </span>
                </div>

                {department.created_at && (
                  <p className="text-xs text-gray-500 mt-3">
                    Created: {new Date(department.created_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Department Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-blue-900 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Add New Department
            </DialogTitle>
            <DialogDescription>Create a new department for your organization</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept_name" className="text-blue-900">
                Department Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dept_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-blue-200"
                placeholder="e.g., Engineering, Sales, HR"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept_description" className="text-blue-900">
                Description
              </Label>
              <textarea
                id="dept_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
                placeholder="Brief description of the department..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Note:</p>
                <p className="text-blue-700">After creating the department, you can assign employees to it through Employee Management.</p>
              </div>
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
            <Button onClick={handleAddDepartment} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
