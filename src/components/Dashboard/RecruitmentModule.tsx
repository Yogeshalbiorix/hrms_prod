import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Filter, Eye, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Clock, DollarSign, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
import { baseUrl } from '../../lib/base-url';
import { Modal } from 'antd';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  experience: string;
  openings: number;
  applicants: number;
  posted_date: string;
  status: 'active' | 'closed' | 'draft';
  salary_range?: string;
  description?: string;
  requirements?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  status: 'applied' | 'screening' | 'interview' | 'offered' | 'rejected';
  applied_date: string;
  location: string;
}

export default function RecruitmentModule() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostJobDialog, setShowPostJobDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as 'full-time' | 'part-time' | 'contract',
    experience: '',
    openings: '1',
    salary_range: '',
    description: '',
    requirements: '',
    status: 'active' as 'active' | 'draft'
  });

  const candidates: Candidate[] = [
    {
      id: '1',
      name: 'Alexandra Martinez',
      email: 'alex.martinez@email.com',
      phone: '+1 234 567 8901',
      position: 'Senior Full Stack Developer',
      experience: '6 years',
      status: 'interview',
      applied_date: '2024-01-18',
      location: 'San Francisco, CA'
    },
    {
      id: '2',
      name: 'James Wilson',
      email: 'james.w@email.com',
      phone: '+1 234 567 8902',
      position: 'Product Marketing Manager',
      experience: '4 years',
      status: 'screening',
      applied_date: '2024-01-19',
      location: 'New York, NY'
    },
    {
      id: '3',
      name: 'Priya Patel',
      email: 'priya.p@email.com',
      phone: '+1 234 567 8903',
      position: 'Data Analyst',
      experience: '3 years',
      status: 'offered',
      applied_date: '2024-01-15',
      location: 'Chicago, IL'
    },
    {
      id: '4',
      name: 'Marcus Thompson',
      email: 'marcus.t@email.com',
      phone: '+1 234 567 8904',
      position: 'HR Business Partner',
      experience: '5 years',
      status: 'applied',
      applied_date: '2024-01-21',
      location: 'Remote'
    },
  ];

  useEffect(() => {
    fetchJobs();
    fetchDepartments();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/jobs`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
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
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handlePostJob = async () => {
    try {
      if (!formData.title || !formData.department || !formData.location || !formData.experience) {
        Modal.warning({
          title: 'Validation Error',
          content: 'Please fill in all required fields',
        });
        return;
      }

      const response = await fetch(`${baseUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowPostJobDialog(false);
        resetForm();
        fetchJobs();
        Modal.success({
          title: 'Success',
          content: 'Job posted successfully!',
        });
      } else {
        Modal.error({
          title: 'Error',
          content: data.error || 'Failed to post job',
        });
      }
    } catch (error) {
      console.error('Error posting job:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to post job. Please try again.',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      location: '',
      type: 'full-time',
      experience: '',
      openings: '1',
      salary_range: '',
      description: '',
      requirements: '',
      status: 'active'
    });
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-full text-xs font-medium">Active</span>;
      case 'closed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-full text-xs font-medium">Closed</span>;
      case 'draft':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400 rounded-full text-xs font-medium">Draft</span>;
      default:
        return null;
    }
  };

  const getCandidateStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock size={12} /> Applied
        </span>;
      case 'screening':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 rounded-full text-xs font-medium">Screening</span>;
      case 'interview':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 rounded-full text-xs font-medium">Interview</span>;
      case 'offered':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle size={12} /> Offered
        </span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle size={12} /> Rejected
        </span>;
      default:
        return null;
    }
  };

  const getJobTypeBadge = (type: string) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
      'part-time': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
      'contract': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    };
    return <span className={`px-2 py-1 ${colors[type as keyof typeof colors]} rounded text-xs font-medium`}>
      {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    </span>;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'jobs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Job Openings
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'candidates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Candidates
        </button>
      </div>

      {/* Job Openings Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Openings</p>
                  <h3 className="text-2xl font-bold">{jobs.filter(j => j.status === 'active').length}</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                  <Briefcase className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Applicants</p>
                  <h3 className="text-2xl font-bold">{jobs.reduce((s, j) => s + (j.applicants || 0), 0)}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <Mail className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Interviews Scheduled</p>
                  <h3 className="text-2xl font-bold">12</h3>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
                  <Calendar className="text-yellow-600 dark:text-yellow-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Offers Extended</p>
                  <h3 className="text-2xl font-bold">8</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Add */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search job openings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowPostJobDialog(true);
              }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus size={20} />
              Post New Job
            </Button>
          </div>

          {/* Job Cards */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.filter(job =>
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.department.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(job => (
                <div key={job.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-semibold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {getJobTypeBadge(job.type)}
                        {getJobStatusBadge(job.status)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 size={14} />
                      {job.department}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={14} />
                      {job.location}
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign size={14} />
                        {job.salary_range}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={14} />
                      Posted: {new Date(job.posted_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Openings: </span>
                        <span className="font-semibold">{job.openings}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applicants: </span>
                        <span className="font-semibold">{job.applicants || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Experience: </span>
                        <span className="font-semibold">{job.experience}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Candidates Tab */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          {/* Filter Options */}
          <div className="flex gap-3 items-center overflow-x-auto pb-2">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm whitespace-nowrap">
              All Candidates
            </button>
            <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm whitespace-nowrap">
              Applied
            </button>
            <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm whitespace-nowrap">
              Screening
            </button>
            <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm whitespace-nowrap">
              Interview
            </button>
            <button className="px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm whitespace-nowrap">
              Offered
            </button>
          </div>

          {/* Candidates Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Candidate</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Position</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Experience</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Location</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Applied Date</th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">Status</th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(candidate => (
                    <tr key={candidate.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-semibold text-sm">
                              {candidate.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Mail size={10} /> {candidate.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{candidate.position}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{candidate.experience}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{candidate.location}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{new Date(candidate.applied_date).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getCandidateStatusBadge(candidate.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-accent rounded-lg transition-colors" title="View Profile">
                            <Eye size={16} />
                          </button>
                          <button className="px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
                            Update Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recruitment Pipeline */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Recruitment Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { stage: 'Applied', count: 85, color: 'bg-blue-500' },
                { stage: 'Screening', count: 42, color: 'bg-purple-500' },
                { stage: 'Interview', count: 24, color: 'bg-yellow-500' },
                { stage: 'Offered', count: 12, color: 'bg-green-500' },
                { stage: 'Rejected', count: 18, color: 'bg-red-500' },
              ].map((stage, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 ${stage.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                    <span className="text-white font-bold text-xl">{stage.count}</span>
                  </div>
                  <p className="font-semibold text-sm">{stage.stage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Post New Job Dialog */}
      <Dialog open={showPostJobDialog} onOpenChange={setShowPostJobDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Post New Job Opening
            </DialogTitle>
            <DialogDescription>Fill in the details to post a new job opening</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="job_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_department">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="job_location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_type">
                  Employment Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_experience">
                  Experience Required <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="job_experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g., 3-5 years"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_openings">
                  Number of Openings <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="job_openings"
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_salary">Salary Range</Label>
                <Input
                  id="job_salary"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  placeholder="e.g., $80k - $120k"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_description">Job Description</Label>
              <textarea
                id="job_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_requirements">Requirements</Label>
              <textarea
                id="job_requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                placeholder="List the required skills and qualifications..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Publish immediately)</SelectItem>
                  <SelectItem value="draft">Draft (Save for later)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPostJobDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePostJob} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
