import React, { useState } from 'react';
import { TrendingUp, Star, Target, Award, Calendar, FileText, Users, Plus } from 'lucide-react';

interface PerformanceRecord {
  id: string;
  employeeName: string;
  department: string;
  rating: number;
  reviewPeriod: string;
  reviewDate: string;
  status: 'completed' | 'pending' | 'scheduled';
  goals: number;
  goalsCompleted: number;
}

interface Goal {
  id: string;
  employeeName: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed' | 'delayed';
}

export default function PerformanceManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'goals'>('overview');

  const performanceRecords: PerformanceRecord[] = [
    {
      id: '1',
      employeeName: 'Sarah Johnson',
      department: 'Engineering',
      rating: 4.5,
      reviewPeriod: 'Q4 2023',
      reviewDate: '2024-01-10',
      status: 'completed',
      goals: 5,
      goalsCompleted: 4
    },
    {
      id: '2',
      employeeName: 'Michael Chen',
      department: 'Sales & Marketing',
      rating: 4.2,
      reviewPeriod: 'Q4 2023',
      reviewDate: '2024-01-12',
      status: 'completed',
      goals: 4,
      goalsCompleted: 4
    },
    {
      id: '3',
      employeeName: 'Emily Rodriguez',
      department: 'Human Resources',
      rating: 0,
      reviewPeriod: 'Q4 2023',
      reviewDate: '2024-01-25',
      status: 'scheduled',
      goals: 3,
      goalsCompleted: 2
    },
    {
      id: '4',
      employeeName: 'David Kim',
      department: 'Finance',
      rating: 4.8,
      reviewPeriod: 'Q4 2023',
      reviewDate: '2024-01-08',
      status: 'completed',
      goals: 6,
      goalsCompleted: 6
    },
  ];

  const goals: Goal[] = [
    {
      id: '1',
      employeeName: 'Sarah Johnson',
      title: 'Complete Full Stack Certification',
      description: 'Obtain AWS Solutions Architect certification',
      category: 'Professional Development',
      dueDate: '2024-03-31',
      progress: 75,
      status: 'on-track'
    },
    {
      id: '2',
      employeeName: 'Michael Chen',
      title: 'Increase Sales by 20%',
      description: 'Achieve 20% increase in quarterly sales targets',
      category: 'Sales Target',
      dueDate: '2024-03-31',
      progress: 85,
      status: 'on-track'
    },
    {
      id: '3',
      employeeName: 'Emily Rodriguez',
      title: 'Reduce Time-to-Hire',
      description: 'Decrease average time-to-hire from 45 to 30 days',
      category: 'Process Improvement',
      dueDate: '2024-02-28',
      progress: 45,
      status: 'at-risk'
    },
    {
      id: '4',
      employeeName: 'David Kim',
      title: 'Automate Monthly Reports',
      description: 'Implement automated financial reporting system',
      category: 'Automation',
      dueDate: '2024-02-15',
      progress: 100,
      status: 'completed'
    },
  ];

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span className="ml-2 text-sm font-semibold">{rating.toFixed(1)}/5.0</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-full text-xs font-medium">Completed</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 rounded-full text-xs font-medium">Pending</span>;
      case 'scheduled':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded-full text-xs font-medium">Scheduled</span>;
      default:
        return null;
    }
  };

  const getGoalStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-full text-xs font-medium">On Track</span>;
      case 'at-risk':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 rounded-full text-xs font-medium">At Risk</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded-full text-xs font-medium">Completed</span>;
      case 'delayed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-full text-xs font-medium">Delayed</span>;
      default:
        return null;
    }
  };

  const avgRating = performanceRecords
    .filter(r => r.rating > 0)
    .reduce((sum, r) => sum + r.rating, 0) / performanceRecords.filter(r => r.rating > 0).length;

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
          Performance Overview
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Performance Reviews
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'goals'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Goals & KPIs
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Avg Rating</p>
                  <h3 className="text-2xl font-bold">{avgRating.toFixed(1)}/5.0</h3>
                  <p className="text-xs text-green-600 mt-1">↑ 0.3 improvement</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
                  <Star className="text-yellow-600 dark:text-yellow-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Reviews Completed</p>
                  <h3 className="text-2xl font-bold">{performanceRecords.filter(r => r.status === 'completed').length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">This quarter</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                  <FileText className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Goals</p>
                  <h3 className="text-2xl font-bold">{goals.filter(g => g.status !== 'completed').length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Across all teams</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <Target className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Top Performers</p>
                  <h3 className="text-2xl font-bold">{performanceRecords.filter(r => r.rating >= 4.5).length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Rating ≥ 4.5</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <Award className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">Rating Distribution</h3>
              <div className="space-y-4">
                {[
                  { range: '4.5 - 5.0', count: 42, color: 'bg-green-500', percentage: 34 },
                  { range: '4.0 - 4.4', count: 58, color: 'bg-blue-500', percentage: 47 },
                  { range: '3.5 - 3.9', count: 18, color: 'bg-yellow-500', percentage: 14 },
                  { range: '3.0 - 3.4', count: 6, color: 'bg-orange-500', percentage: 5 },
                  { range: 'Below 3.0', count: 0, color: 'bg-red-500', percentage: 0 },
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.range}</span>
                      <span className="text-sm text-muted-foreground">{item.count} employees</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">Department Performance</h3>
              <div className="space-y-4">
                {[
                  { dept: 'Engineering', rating: 4.3, employees: 342 },
                  { dept: 'Sales & Marketing', rating: 4.5, employees: 198 },
                  { dept: 'Human Resources', rating: 4.1, employees: 54 },
                  { dept: 'Finance', rating: 4.6, employees: 89 },
                  { dept: 'Operations', rating: 4.2, employees: 156 },
                ].map((dept, index) => (
                  <div key={index} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{dept.dept}</p>
                      <p className="text-xs text-muted-foreground">{dept.employees} employees</p>
                    </div>
                    <div className="text-right">
                      {getRatingStars(dept.rating)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Top Performers This Quarter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceRecords
                .filter(r => r.rating >= 4.5)
                .map(record => (
                  <div key={record.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {record.employeeName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{record.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{record.department}</p>
                      </div>
                      <Award className="text-yellow-500" size={24} />
                    </div>
                    {getRatingStars(record.rating)}
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      {record.goalsCompleted}/{record.goals} goals completed
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium">
              <Plus size={20} />
              Schedule Review
            </button>
            <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm">
              Export Reports
            </button>
          </div>

          {/* Reviews Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Employee</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Department</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Review Period</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Review Date</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Rating</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Goals</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Status</th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceRecords.map(record => (
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
                        <span className="text-sm">{record.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{record.reviewPeriod}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{new Date(record.reviewDate).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {record.rating > 0 ? getRatingStars(record.rating) : <span className="text-sm text-muted-foreground">Not rated</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{record.goalsCompleted}/{record.goals}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {record.status === 'completed' ? (
                            <button className="px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
                              View Report
                            </button>
                          ) : (
                            <button className="px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                              Conduct Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium">
              <Plus size={20} />
              Set New Goal
            </button>
            <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm">
              View All Goals
            </button>
          </div>

          {/* Goal Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'On Track', count: goals.filter(g => g.status === 'on-track').length, color: 'text-green-600' },
              { label: 'At Risk', count: goals.filter(g => g.status === 'at-risk').length, color: 'text-yellow-600' },
              { label: 'Completed', count: goals.filter(g => g.status === 'completed').length, color: 'text-blue-600' },
              { label: 'Delayed', count: goals.filter(g => g.status === 'delayed').length, color: 'text-red-600' },
            ].map((item, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 text-center">
                <h3 className={`text-3xl font-bold ${item.color}`}>{item.count}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Goals List */}
          <div className="space-y-4">
            {goals.map(goal => (
              <div key={goal.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{goal.title}</h4>
                      {getGoalStatusBadge(goal.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-muted-foreground" />
                        <span>{goal.employeeName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target size={14} className="text-muted-foreground" />
                        <span>{goal.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{goal.progress}%</span>
                  </div>
                  <div className="bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        goal.progress >= 75 ? 'bg-green-500' :
                        goal.progress >= 50 ? 'bg-blue-500' :
                        goal.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
