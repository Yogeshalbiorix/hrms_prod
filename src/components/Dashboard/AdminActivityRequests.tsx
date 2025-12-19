import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Select, message, Modal, Input, Tabs, Badge, Descriptions } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { TextArea } = Input;

interface ActivityRequest {
  id: number;
  employee_id: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  notes: string | null;
  rejection_reason?: string | null;
  created_at: string;
  approval_date: string | null;
  approved_by: number | null;
  employee_name: string;
  employee_email: string;
  department: string;
  approver_username: string | null;
  request_type: 'wfh' | 'partial' | 'regularization';
  // Partial day specific
  start_time?: string;
  end_time?: string;
  duration?: string;
  // Regularization specific
  clock_in?: string;
  clock_out?: string;
}

const AdminActivityRequests: React.FC = () => {
  const [requests, setRequests] = useState<ActivityRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ActivityRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filterType, filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const url = `/api/activity/admin/requests?type=${filterType}&status=${filterStatus}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      const result = await response.json() as any;
      if (result.success) {
        setRequests(result.data.all || []);
      } else {
        message.error(result.error || 'Failed to fetch requests');
      }
    } catch (error) {
      message.error('Failed to fetch activity requests');
    }
    setLoading(false);
  };

  const showDetailsModal = (record: ActivityRequest) => {
    setSelectedRequest(record);
    setDetailsModalVisible(true);
  };

  const showActionModal = (record: ActivityRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(record);
    setActionType(action);
    setActionNotes('');
    setActionModalVisible(true);
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    // Validate rejection reason if rejecting
    if (actionType === 'reject' && !actionNotes.trim()) {
      message.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/activity/admin/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          id: selectedRequest.id,
          type: selectedRequest.request_type,
          action: actionType,
          notes: actionNotes
        })
      });
      const result = await response.json() as any;
      if (result.success) {
        message.success(`Request ${actionType}d successfully`);
        setActionModalVisible(false);
        setActionNotes('');
        fetchRequests();
      } else {
        message.error(result.error || `Failed to ${actionType} request`);
      }
    } catch (error) {
      message.error(`Failed to ${actionType} request`);
    }
    setActionLoading(false);
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <ClockCircleOutlined /> },
      approved: { color: 'success', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', icon: <CloseCircleOutlined /> }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const getRequestTypeTag = (type: string) => {
    const typeConfig = {
      wfh: { color: 'blue', icon: <HomeOutlined />, text: 'Work From Home' },
      partial: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Partial Day' },
      regularization: { color: 'purple', icon: <ClockCircleOutlined />, text: 'Regularization' }
    };
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.wfh;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const columns: ColumnsType<ActivityRequest> = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.employee_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.employee_email}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.department}</div>
        </div>
      ),
      width: 200
    },
    {
      title: 'Type',
      dataIndex: 'request_type',
      key: 'type',
      render: (type) => getRequestTypeTag(type),
      width: 150
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      width: 120
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => {
        if (record.request_type === 'partial') {
          return (
            <div style={{ fontSize: 12 }}>
              <div>{record.start_time} - {record.end_time}</div>
              <div style={{ color: '#999' }}>Duration: {record.duration} hrs</div>
            </div>
          );
        } else if (record.request_type === 'regularization') {
          return (
            <div style={{ fontSize: 12 }}>
              <div>In: {record.clock_in}</div>
              <div>Out: {record.clock_out}</div>
            </div>
          );
        }
        return record.reason ? (
          <div style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.reason}
          </div>
        ) : '-';
      },
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 120
    },
    {
      title: 'Rejection Reason',
      dataIndex: 'notes',
      key: 'rejection_reason',
      render: (notes, record) => (
        record.status === 'rejected' && notes ? (
          <div style={{ fontSize: 12, maxWidth: 200, color: '#ff4d4f' }}>
            {notes}
          </div>
        ) : record.status === 'rejected' && !notes ? (
          <span style={{ color: '#999', fontSize: 12 }}>No reason</span>
        ) : null
      ),
      width: 150
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      width: 130
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetailsModal(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => showActionModal(record, 'approve')}
              >
                Approve
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseCircleOutlined />}
                danger
                onClick={() => showActionModal(record, 'reject')}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
      width: 220
    }
  ];

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <span>Activity Requests Management</span>
            <Badge count={pendingCount} style={{ backgroundColor: '#faad14' }} />
          </Space>
        }
        extra={
          <Space>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 180 }}
            >
              <Option value="all">All Types</Option>
              <Option value="wfh">Work From Home</Option>
              <Option value="partial">Partial Day</Option>
              <Option value="regularization">Regularization</Option>
            </Select>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchRequests}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} requests`
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Request Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          selectedRequest?.status === 'pending' && (
            <Button
              key="approve"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setDetailsModalVisible(false);
                showActionModal(selectedRequest, 'approve');
              }}
            >
              Approve
            </Button>
          ),
          selectedRequest?.status === 'pending' && (
            <Button
              key="reject"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setDetailsModalVisible(false);
                showActionModal(selectedRequest, 'reject');
              }}
            >
              Reject
            </Button>
          )
        ]}
        width={600}
      >
        {selectedRequest && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Employee">
              {selectedRequest.employee_name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedRequest.employee_email}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {selectedRequest.department}
            </Descriptions.Item>
            <Descriptions.Item label="Request Type">
              {getRequestTypeTag(selectedRequest.request_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {new Date(selectedRequest.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </Descriptions.Item>
            {selectedRequest.request_type === 'partial' && (
              <>
                <Descriptions.Item label="Start Time">
                  {selectedRequest.start_time}
                </Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {selectedRequest.end_time}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {selectedRequest.duration} hours
                </Descriptions.Item>
              </>
            )}
            {selectedRequest.request_type === 'regularization' && (
              <>
                <Descriptions.Item label="Clock In">
                  {selectedRequest.clock_in}
                </Descriptions.Item>
                <Descriptions.Item label="Clock Out">
                  {selectedRequest.clock_out}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Reason">
              {selectedRequest.reason || 'No reason provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getStatusTag(selectedRequest.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted At">
              {new Date(selectedRequest.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Descriptions.Item>
            {selectedRequest.approval_date && (
              <Descriptions.Item label="Approval Date">
                {new Date(selectedRequest.approval_date).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Descriptions.Item>
            )}
            {selectedRequest.approver_username && (
              <Descriptions.Item label="Approved By">
                {selectedRequest.approver_username}
              </Descriptions.Item>
            )}
            {selectedRequest.notes && (
              <Descriptions.Item
                label={selectedRequest.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
                span={2}
              >
                <div style={{ color: selectedRequest.status === 'rejected' ? '#ff4d4f' : 'inherit' }}>
                  {selectedRequest.notes}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Request`}
        open={actionModalVisible}
        onOk={handleAction}
        onCancel={() => {
          setActionModalVisible(false);
          setActionNotes('');
        }}
        okText={actionType === 'approve' ? 'Approve' : 'Reject'}
        confirmLoading={actionLoading}
        okButtonProps={{
          icon: actionType === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
          danger: actionType === 'reject'
        }}
      >
        {selectedRequest && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <strong>Employee:</strong> {selectedRequest.employee_name}
            </div>
            <div>
              <strong>Request Type:</strong> {getRequestTypeTag(selectedRequest.request_type)}
            </div>
            <div>
              <strong>Date:</strong> {new Date(selectedRequest.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div>
              <label style={{ fontWeight: actionType === 'reject' ? 500 : 'normal' }}>
                {actionType === 'reject' ? (
                  <span>
                    Rejection Reason <span style={{ color: '#ff4d4f' }}>*</span>
                  </span>
                ) : (
                  'Admin Notes (Optional):'
                )}
              </label>
              <TextArea
                rows={4}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === 'reject'
                    ? 'Please provide a clear reason for rejecting this request. This will be sent to the employee...'
                    : 'Add notes for approving this request...'
                }
                style={{ marginTop: 8 }}
                maxLength={500}
                showCount
              />
              {actionType === 'reject' && (
                <div style={{ marginTop: 8, color: '#999', fontSize: '12px' }}>
                  <CloseCircleOutlined style={{ marginRight: 4 }} />
                  The employee will receive a notification with your rejection reason.
                </div>
              )}
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default AdminActivityRequests;
