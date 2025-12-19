import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Statistic,
  Row,
  Col,
  Tabs,
  message,
  Tooltip,
  Badge,
  Descriptions,
  Empty,
  Progress,
  Timeline,
  Avatar,
  Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SolutionOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  LinkedinOutlined,
  FileTextOutlined,
  StarOutlined,
  TrophyOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import { baseUrl } from '../../lib/base-url';

const { TextArea } = Input;
const { Option } = Select;

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
  skills?: string[];
  rating?: number;
  resume_url?: string;
  linkedin_url?: string;
  notes?: string;
}

export default function RecruitmentModule() {
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostJobDialog, setShowPostJobDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

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
      location: 'San Francisco, CA',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
      rating: 4.5,
      resume_url: '#',
      linkedin_url: '#',
      notes: 'Strong technical background with excellent problem-solving skills.'
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
      location: 'New York, NY',
      skills: ['Marketing Strategy', 'Data Analytics', 'SEO', 'Content Marketing'],
      rating: 4.2,
      resume_url: '#',
      linkedin_url: '#'
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
      location: 'Chicago, IL',
      skills: ['Python', 'SQL', 'Tableau', 'Machine Learning', 'Statistics'],
      rating: 4.8,
      resume_url: '#',
      linkedin_url: '#',
      notes: 'Exceptional analytical skills and data visualization expertise.'
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
      location: 'Remote',
      skills: ['Talent Acquisition', 'Employee Relations', 'HR Analytics', 'Change Management'],
      rating: 4.0,
      resume_url: '#',
      linkedin_url: '#'
    },
    {
      id: '5',
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '+1 234 567 8905',
      position: 'Senior Full Stack Developer',
      experience: '7 years',
      status: 'interview',
      applied_date: '2024-01-17',
      location: 'Seattle, WA',
      skills: ['Vue.js', 'Python', 'PostgreSQL', 'Kubernetes', 'CI/CD'],
      rating: 4.6,
      resume_url: '#',
      linkedin_url: '#'
    },
    {
      id: '6',
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1 234 567 8906',
      position: 'Data Analyst',
      experience: '2 years',
      status: 'screening',
      applied_date: '2024-01-20',
      location: 'Boston, MA',
      skills: ['R', 'Excel', 'Power BI', 'Data Mining'],
      rating: 3.8,
      resume_url: '#',
      linkedin_url: '#'
    },
  ];

  useEffect(() => {
    fetchJobs();
    fetchDepartments();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/jobs`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data?: JobOpening[]; error?: string };
      if (data.success) {
        setJobs(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/departments`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const data = await response.json() as { success: boolean; data?: any[]; error?: string };
      if (data.success) {
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handlePostJob = async () => {
    try {
      const values = await form.validateFields();

      const isEditing = editingJobId !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing ? { ...values, id: editingJobId } : values;

      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${baseUrl}/api/jobs`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as { success: boolean; data?: any; error?: string };
      if (data.success) {
        message.success(isEditing ? 'Job updated successfully!' : 'Job posted successfully!');
        setShowPostJobDialog(false);
        setEditingJobId(null);
        form.resetFields();
        fetchJobs();
      } else {
        message.error(data.error || (isEditing ? 'Failed to update job' : 'Failed to post job'));
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.warning('Please fill in all required fields');
      } else {
        console.error('Error posting/updating job:', error);
        message.error('Failed to save job. Please try again.');
      }
    }
  };

  const handleDeleteJob = async (id: string) => {
    Modal.confirm({
      title: 'Delete Job Opening',
      content: 'Are you sure you want to delete this job opening? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const sessionToken = localStorage.getItem('sessionToken');
          const response = await fetch(`${baseUrl}/api/jobs`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ id }),
          });

          const data = await response.json() as { success: boolean; error?: string };
          if (data.success) {
            message.success('Job opening deleted successfully');
            fetchJobs();
          } else {
            message.error(data.error || 'Failed to delete job opening');
          }
        } catch (error) {
          console.error('Error deleting job:', error);
          message.error('Failed to delete job opening');
        }
      },
    });
  };

  const handleViewJob = (job: JobOpening) => {
    setSelectedJob(job);
  };

  const getJobStatusTag = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: 'success', icon: <CheckCircleOutlined /> },
      closed: { color: 'error', icon: <CloseCircleOutlined /> },
      draft: { color: 'default', icon: <ClockCircleOutlined /> },
    };
    const { color, icon } = config[status] || config.draft;
    return <Tag color={color} icon={icon}>{status.charAt(0).toUpperCase() + status.slice(1)}</Tag>;
  };

  const getCandidateStatusTag = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      applied: { color: 'blue', icon: <ClockCircleOutlined /> },
      screening: { color: 'purple', icon: <SearchOutlined /> },
      interview: { color: 'warning', icon: <CalendarOutlined /> },
      offered: { color: 'success', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', icon: <CloseCircleOutlined /> },
    };
    const { color, icon } = config[status] || config.applied;
    return <Tag color={color} icon={icon}>{status.charAt(0).toUpperCase() + status.slice(1)}</Tag>;
  };

  const getJobTypeTag = (type: string) => {
    const config: Record<string, string> = {
      'full-time': 'blue',
      'part-time': 'purple',
      'contract': 'orange',
    };
    return <Tag color={config[type]}>{type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Tag>;
  };

  // Job Table Columns
  const jobColumns: ColumnsType<JobOpening> = [
    {
      title: 'Job Title',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 250,
      render: (title: string, record: JobOpening) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>{title}</span>
          <Space size={4}>
            {getJobTypeTag(record.type)}
            {getJobStatusTag(record.status)}
          </Space>
        </Space>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      filters: [...new Set(departments.map(d => d.name))].map(name => ({ text: name, value: name })),
      onFilter: (value, record) => record.department === value,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: string) => (
        <Space>
          <EnvironmentOutlined />
          {location}
        </Space>
      ),
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience',
      width: 120,
    },
    {
      title: 'Openings',
      dataIndex: 'openings',
      key: 'openings',
      width: 100,
      align: 'center',
      render: (openings: number) => <Badge count={openings} showZero color="blue" />,
      sorter: (a, b) => a.openings - b.openings,
    },
    {
      title: 'Applicants',
      dataIndex: 'applicants',
      key: 'applicants',
      width: 100,
      align: 'center',
      render: (applicants: number) => <Badge count={applicants || 0} showZero color="green" />,
      sorter: (a, b) => (a.applicants || 0) - (b.applicants || 0),
    },
    {
      title: 'Salary Range',
      dataIndex: 'salary_range',
      key: 'salary_range',
      width: 150,
      render: (salary: string) => salary ? (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          {salary}
        </Space>
      ) : <span style={{ color: '#bfbfbf' }}>Not specified</span>,
    },
    {
      title: 'Posted Date',
      dataIndex: 'posted_date',
      key: 'posted_date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.posted_date).getTime() - new Date(b.posted_date).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: any, record: JobOpening) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewJob(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingJobId(record.id);
                form.setFieldsValue(record);
                setShowPostJobDialog(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteJob(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Candidate Table Columns
  const candidateColumns: ColumnsType<Candidate> = [
    {
      title: 'Candidate',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 250,
      render: (name: string, record: Candidate) => (
        <Space>
          <Avatar
            size={48}
            style={{
              backgroundColor: '#1890ff',
              fontSize: '18px',
              fontWeight: 600
            }}
          >
            {name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{name}</span>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email}
            </span>
            {record.rating && (
              <div>
                <StarOutlined style={{ color: '#faad14', fontSize: 12 }} />
                <span style={{ marginLeft: 4, fontSize: 12, color: '#595959' }}>
                  {record.rating.toFixed(1)}
                </span>
              </div>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 220,
      render: (position: string, record: Candidate) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{position}</span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.experience} experience
          </span>
        </Space>
      ),
    },
    {
      title: 'Skills',
      dataIndex: 'skills',
      key: 'skills',
      width: 250,
      render: (skills: string[]) => (
        <Space size={[4, 4]} wrap>
          {skills?.slice(0, 3).map((skill, idx) => (
            <Tag key={idx} color="blue" style={{ fontSize: '11px', margin: 0 }}>
              {skill}
            </Tag>
          ))}
          {skills && skills.length > 3 && (
            <Tag style={{ fontSize: '11px', margin: 0 }}>+{skills.length - 3}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
          <span style={{ fontSize: '13px' }}>{location}</span>
        </Space>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone: string, record: Candidate) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontSize: 12 }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {phone}
          </span>
          {record.linkedin_url && (
            <a href={record.linkedin_url} style={{ fontSize: 12 }}>
              <LinkedinOutlined style={{ marginRight: 4 }} />
              LinkedIn
            </a>
          )}
        </Space>
      ),
    },
    {
      title: 'Applied',
      dataIndex: 'applied_date',
      key: 'applied_date',
      width: 120,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: '13px' }}>
            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
            {Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </span>
        </Space>
      ),
      sorter: (a, b) => new Date(a.applied_date).getTime() - new Date(b.applied_date).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: [
        { text: 'Applied', value: 'applied' },
        { text: 'Screening', value: 'screening' },
        { text: 'Interview', value: 'interview' },
        { text: 'Offered', value: 'offered' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => getCandidateStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_: any, record: Candidate) => (
        <Space size="small">
          <Tooltip title="View Profile">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedCandidate(record);
                setShowCandidateDetail(true);
              }}
            >
              View
            </Button>
          </Tooltip>
          {record.resume_url && (
            <Tooltip title="Download Resume">
              <Button
                icon={<FileTextOutlined />}
                size="small"
                href={record.resume_url}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(candidate => {
    if (candidateStatusFilter !== 'all' && candidate.status !== candidateStatusFilter) {
      return false;
    }
    return candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const tabItems = [
    {
      key: 'jobs',
      label: (
        <span>
          <SolutionOutlined />
          Job Openings
        </span>
      ),
      children: (
        <div style={{ marginTop: 24 }}>
          {/* Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Active Openings</span>}
                  value={jobs.filter(j => j.status === 'active').length}
                  prefix={<SolutionOutlined />}
                  valueStyle={{ color: '#fff', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Total Applicants</span>}
                  value={jobs.reduce((s, j) => s + (j.applicants || 0), 0)}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#fff', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Interviews</span>}
                  value={candidates.filter(c => c.status === 'interview').length}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#fff', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Offers Extended</span>}
                  value={candidates.filter(c => c.status === 'offered').length}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#fff', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Search and Actions */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Input
                  placeholder="Search job openings..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="large"
                  allowClear
                />
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={fetchJobs} size="large">
                    Refresh
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingJobId(null);
                      form.resetFields();
                      setShowPostJobDialog(true);
                    }}
                    size="large"
                  >
                    Post New Job
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Jobs Table */}
          <Card>
            <Table
              columns={jobColumns}
              dataSource={filteredJobs}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} jobs`,
                pageSizeOptions: ['10', '20', '50'],
              }}
              scroll={{ x: 1400 }}
              locale={{
                emptyText: <Empty description="No job openings found" />,
              }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'candidates',
      label: (
        <span>
          <TeamOutlined />
          Candidates
        </span>
      ),
      children: (
        <div style={{ marginTop: 24 }}>
          {/* Filter Buttons */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <Space size="small" wrap>
                  <Button
                    type={candidateStatusFilter === 'all' ? 'primary' : 'default'}
                    onClick={() => setCandidateStatusFilter('all')}
                  >
                    All Candidates ({candidates.length})
                  </Button>
                  <Button
                    type={candidateStatusFilter === 'applied' ? 'primary' : 'default'}
                    onClick={() => setCandidateStatusFilter('applied')}
                    icon={<ClockCircleOutlined />}
                  >
                    Applied ({candidates.filter(c => c.status === 'applied').length})
                  </Button>
                  <Button
                    type={candidateStatusFilter === 'screening' ? 'primary' : 'default'}
                    onClick={() => setCandidateStatusFilter('screening')}
                    icon={<SearchOutlined />}
                  >
                    Screening ({candidates.filter(c => c.status === 'screening').length})
                  </Button>
                  <Button
                    type={candidateStatusFilter === 'interview' ? 'primary' : 'default'}
                    onClick={() => setCandidateStatusFilter('interview')}
                    icon={<CalendarOutlined />}
                  >
                    Interview ({candidates.filter(c => c.status === 'interview').length})
                  </Button>
                  <Button
                    type={candidateStatusFilter === 'offered' ? 'primary' : 'default'}
                    onClick={() => setCandidateStatusFilter('offered')}
                    icon={<CheckCircleOutlined />}
                  >
                    Offered ({candidates.filter(c => c.status === 'offered').length})
                  </Button>
                </Space>
              </Col>
              <Col>
                <Input
                  placeholder="Search candidates..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                  allowClear
                />
              </Col>
            </Row>
          </Card>

          {/* Candidates Table */}
          <Card>
            <Table
              columns={candidateColumns}
              dataSource={filteredCandidates}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} candidates`,
                pageSizeOptions: ['10', '20', '50'],
              }}
              scroll={{ x: 1400 }}
              locale={{
                emptyText: <Empty description="No candidates found" />,
              }}
            />
          </Card>

          {/* Recruitment Pipeline */}
          <Card
            title={
              <span>
                <ProjectOutlined style={{ marginRight: 8 }} />
                Recruitment Pipeline Analytics
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={16} justify="space-around">
              {[
                { stage: 'Applied', count: candidates.filter(c => c.status === 'applied').length, color: '#1890ff', icon: <ClockCircleOutlined /> },
                { stage: 'Screening', count: candidates.filter(c => c.status === 'screening').length, color: '#722ed1', icon: <SearchOutlined /> },
                { stage: 'Interview', count: candidates.filter(c => c.status === 'interview').length, color: '#faad14', icon: <CalendarOutlined /> },
                { stage: 'Offered', count: candidates.filter(c => c.status === 'offered').length, color: '#52c41a', icon: <CheckCircleOutlined /> },
                { stage: 'Rejected', count: candidates.filter(c => c.status === 'rejected').length, color: '#f5222d', icon: <CloseCircleOutlined /> },
              ].map((stage, index) => (
                <Col key={index} xs={12} sm={8} md={4} style={{ textAlign: 'center' }}>
                  <Tooltip title={`${stage.count} candidates in ${stage.stage} stage`}>
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        background: stage.color,
                        margin: '0 auto 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 32,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'transform 0.3s',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {stage.count}
                    </div>
                  </Tooltip>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{stage.stage}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {candidates.length > 0 ? Math.round((stage.count / candidates.length) * 100) : 0}%
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Tabs
        defaultActiveKey="jobs"
        items={tabItems}
        size="large"
        type="card"
        tabBarStyle={{
          marginBottom: 24,
          borderBottom: '2px solid #e8e8e8'
        }}
      />

      {/* Post Job Modal */}
      <Modal
        title={
          <Space>
            {editingJobId ? <EditOutlined style={{ fontSize: '20px', color: '#1890ff' }} /> : <SolutionOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
            <span style={{ fontSize: '18px', fontWeight: 600 }}>
              {editingJobId ? 'Edit Job Opening' : 'Post New Job Opening'}
            </span>
          </Space>
        }
        open={showPostJobDialog}
        onCancel={() => {
          setShowPostJobDialog(false);
          setEditingJobId(null);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowPostJobDialog(false);
            setEditingJobId(null);
            form.resetFields();
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handlePostJob}>
            {editingJobId ? 'Update Job' : 'Post Job'}
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Job Title"
                rules={[{ required: true, message: 'Please enter job title' }]}
              >
                <Input placeholder="e.g., Senior Software Engineer" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.name}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="e.g., San Francisco, CA or Remote" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Employment Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select placeholder="Select employment type">
                  <Option value="full-time">Full-time</Option>
                  <Option value="part-time">Part-time</Option>
                  <Option value="contract">Contract</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="experience"
                label="Experience Required"
                rules={[{ required: true, message: 'Please enter experience' }]}
              >
                <Input placeholder="e.g., 3-5 years" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="openings"
                label="Number of Openings"
                rules={[{ required: true, message: 'Please enter openings' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="salary_range"
                label="Salary Range"
              >
                <Input placeholder="e.g., $80k - $120k" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Job Description"
          >
            <TextArea rows={4} placeholder="Describe the role and responsibilities..." />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="Requirements"
          >
            <TextArea rows={4} placeholder="List the required skills and qualifications..." />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
          >
            <Select>
              <Option value="active">Active (Publish immediately)</Option>
              <Option value="draft">Draft (Save for later)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Job Details Modal */}
      <Modal
        title={
          <Space>
            <SolutionOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>Job Opening Details</span>
          </Space>
        }
        open={!!selectedJob}
        onCancel={() => setSelectedJob(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedJob(null)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              if (selectedJob) {
                form.setFieldsValue(selectedJob);
                setShowPostJobDialog(true);
                setSelectedJob(null);
              }
            }}
          >
            Edit Job
          </Button>,
        ]}
        width={700}
      >
        {selectedJob && (
          <Descriptions column={2} bordered style={{ marginTop: 16 }}>
            <Descriptions.Item label="Job Title" span={2}>
              <strong>{selectedJob.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Department">{selectedJob.department}</Descriptions.Item>
            <Descriptions.Item label="Location">
              <EnvironmentOutlined /> {selectedJob.location}
            </Descriptions.Item>
            <Descriptions.Item label="Type">{getJobTypeTag(selectedJob.type)}</Descriptions.Item>
            <Descriptions.Item label="Status">{getJobStatusTag(selectedJob.status)}</Descriptions.Item>
            <Descriptions.Item label="Experience">{selectedJob.experience}</Descriptions.Item>
            <Descriptions.Item label="Openings">
              <Badge count={selectedJob.openings} showZero color="blue" />
            </Descriptions.Item>
            <Descriptions.Item label="Applicants">
              <Badge count={selectedJob.applicants || 0} showZero color="green" />
            </Descriptions.Item>
            <Descriptions.Item label="Salary Range">
              {selectedJob.salary_range || 'Not specified'}
            </Descriptions.Item>
            <Descriptions.Item label="Posted Date" span={2}>
              <CalendarOutlined /> {new Date(selectedJob.posted_date).toLocaleDateString()}
            </Descriptions.Item>
            {selectedJob.description && (
              <Descriptions.Item label="Description" span={2}>
                {selectedJob.description}
              </Descriptions.Item>
            )}
            {selectedJob.requirements && (
              <Descriptions.Item label="Requirements" span={2}>
                {selectedJob.requirements}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Candidate Detail Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>Candidate Profile</span>
          </Space>
        }
        open={showCandidateDetail}
        onCancel={() => {
          setShowCandidateDetail(false);
          setSelectedCandidate(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowCandidateDetail(false);
            setSelectedCandidate(null);
          }}>
            Close
          </Button>,
          <Button
            key="update"
            type="primary"
            onClick={() => {
              if (selectedCandidate) {
                Modal.confirm({
                  title: 'Update Candidate Status',
                  content: (
                    <div>
                      <p>Select new status for {selectedCandidate.name}:</p>
                      <Select
                        defaultValue={selectedCandidate.status}
                        style={{ width: '100%', marginTop: 16 }}
                        id="status-select"
                      >
                        <Option value="applied">Applied</Option>
                        <Option value="screening">Screening</Option>
                        <Option value="interview">Interview</Option>
                        <Option value="offered">Offered</Option>
                        <Option value="rejected">Rejected</Option>
                      </Select>
                    </div>
                  ),
                  onOk: () => {
                    message.success('Candidate status updated successfully!');
                  },
                });
              }
            }}
          >
            Update Status
          </Button>,
        ]}
        width={700}
      >
        {selectedCandidate && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={80}
                style={{
                  backgroundColor: '#1890ff',
                  fontSize: '32px',
                  fontWeight: 600,
                  marginBottom: 12
                }}
              >
                {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <h2 style={{ marginBottom: 4, fontSize: '22px' }}>{selectedCandidate.name}</h2>
              <p style={{ color: '#8c8c8c', marginBottom: 8 }}>{selectedCandidate.position}</p>
              {selectedCandidate.rating && (
                <div>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <span style={{ marginLeft: 8, fontWeight: 600 }}>
                    {selectedCandidate.rating.toFixed(1)} / 5.0
                  </span>
                </div>
              )}
            </div>

            <Divider>Contact Information</Divider>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={<><MailOutlined /> Email</>}>
                <a href={`mailto:${selectedCandidate.email}`}>{selectedCandidate.email}</a>
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                <a href={`tel:${selectedCandidate.phone}`}>{selectedCandidate.phone}</a>
              </Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> Location</>}>
                {selectedCandidate.location}
              </Descriptions.Item>
              {selectedCandidate.linkedin_url && (
                <Descriptions.Item label={<><LinkedinOutlined /> LinkedIn</>}>
                  <a href={selectedCandidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                </Descriptions.Item>
              )}
              {selectedCandidate.resume_url && (
                <Descriptions.Item label={<><FileTextOutlined /> Resume</>}>
                  <Button
                    type="link"
                    href={selectedCandidate.resume_url}
                    icon={<FileTextOutlined />}
                  >
                    Download Resume
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider>Professional Details</Divider>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Experience">{selectedCandidate.experience}</Descriptions.Item>
              <Descriptions.Item label="Applied Date">
                {new Date(selectedCandidate.applied_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Descriptions.Item>
              <Descriptions.Item label="Current Status">
                {getCandidateStatusTag(selectedCandidate.status)}
              </Descriptions.Item>
            </Descriptions>

            {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
              <>
                <Divider>Skills</Divider>
                <Space size={[8, 8]} wrap>
                  {selectedCandidate.skills.map((skill, idx) => (
                    <Tag key={idx} color="blue" style={{ padding: '4px 12px', fontSize: '13px' }}>
                      {skill}
                    </Tag>
                  ))}
                </Space>
              </>
            )}

            {selectedCandidate.notes && (
              <>
                <Divider>Notes</Divider>
                <p style={{ color: '#595959' }}>{selectedCandidate.notes}</p>
              </>
            )}

            <Divider>Application Timeline</Divider>
            <Timeline>
              <Timeline.Item color="green">
                <p><strong>Application Received</strong></p>
                <p style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  {new Date(selectedCandidate.applied_date).toLocaleDateString()}
                </p>
              </Timeline.Item>
              {selectedCandidate.status !== 'applied' && (
                <Timeline.Item color="blue">
                  <p><strong>Moved to {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}</strong></p>
                  <p style={{ color: '#8c8c8c', fontSize: '12px' }}>Status updated</p>
                </Timeline.Item>
              )}
            </Timeline>
          </div>
        )}
      </Modal>
    </div>
  );
}
