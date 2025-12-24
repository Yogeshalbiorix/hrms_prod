import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Tag, Statistic, Progress, Space, Modal, message, Empty, Typography } from 'antd';
import {
    PlusOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Mock data for charts (to be replaced with real data logic later if needed)
const weeklyData = [
    { name: 'Mon', days: 2 },
    { name: 'Tue', days: 1 },
    { name: 'Wed', days: 0 },
    { name: 'Thu', days: 1 },
    { name: 'Fri', days: 3 },
    { name: 'Sat', days: 0 },
    { name: 'Sun', days: 0 },
];

const monthlyData = [
    { name: 'Apr', days: 1 },
    { name: 'May', days: 0 },
    { name: 'Jun', days: 2 },
    { name: 'Jul', days: 5 },
    { name: 'Aug', days: 1 },
    { name: 'Sep', days: 0 },
    { name: 'Oct', days: 0 },
    { name: 'Nov', days: 0 },
    { name: 'Dec', days: 0 },
    { name: 'Jan', days: 0 },
    { name: 'Feb', days: 0 },
    { name: 'Mar', days: 0 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function LeaveDashboard({
    leaveRequests,
    loading,
    leaveBalance,
    onRequestLeave,
    onCancelLeave,
    fetchData
}: any) {

    // Process leave types for the Pie Chart
    const getLeaveTypeStats = () => {
        const stats: any = {};
        leaveRequests.forEach((req: any) => {
            if (req.status === 'approved') {
                stats[req.leave_type] = (stats[req.leave_type] || 0) + req.total_days;
            }
        });
        return Object.keys(stats).map(type => ({
            name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
            value: stats[type]
        }));
    };

    const typeData = getLeaveTypeStats().length > 0 ? getLeaveTypeStats() : [{ name: 'None', value: 1 }];
    const hasLeaveStats = getLeaveTypeStats().length > 0;

    // Filter pending requests
    const pendingRequests = leaveRequests.filter((r: any) => r.status === 'pending');

    const columns = [
        {
            title: 'LEAVE DATES',
            key: 'dates',
            render: (text: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>
                        {dayjs(record.start_date).format('DD MMM YYYY')}
                        {record.start_date !== record.end_date && ` - ${dayjs(record.end_date).format('DD MMM YYYY')}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{record.total_days} Day{record.total_days > 1 ? 's' : ''}</div>
                </div>
            )
        },
        {
            title: 'LEAVE TYPE',
            dataIndex: 'leave_type',
            key: 'leave_type',
            render: (type: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Requested on {dayjs(record.created_at).format('DD MMM YYYY')}</div>
                </div>
            )
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: any) => {
                let color = 'default';
                if (status === 'approved') color = 'success';
                if (status === 'rejected') color = 'error';
                if (status === 'pending') color = 'warning';
                return (
                    <div>
                        <Tag color={color}>{status.toUpperCase()}</Tag>
                        {status !== 'pending' && <div style={{ fontSize: '12px', color: '#888' }}>by {record.approved_by || 'Admin'}</div>}
                    </div>
                );
            }
        },
        {
            title: 'REQUESTED BY',
            key: 'requested_by',
            render: () => "Me" // Since this is user dashboard
        },
        {
            title: 'ACTION TAKEN ON',
            key: 'action_date',
            render: (text: any, record: any) => record.approval_date ? dayjs(record.approval_date).format('DD MMM YYYY') : '-'
        },
        {
            title: 'LEAVE NOTE',
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true,
            render: (text: string) => <div style={{ maxWidth: 200 }} title={text}>{text}</div>
        },
        {
            title: 'REJECT/CANCEL REASON',
            dataIndex: 'rejection_reason',
            key: 'rejection_reason',
            render: (text: string) => text || '-'
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            render: (text: any, record: any) => (
                record.status === 'pending' ? (
                    <Button type="link" danger size="small" onClick={() => onCancelLeave(record.id)}>Cancel</Button>
                ) : <span style={{ color: '#ccc' }}>...</span>
            )
        }
    ];

    return (
        <div className="leave-dashboard">
            {/* Summary Section */}
            <Card style={{ marginBottom: 20, background: '#f0f5ff', borderColor: '#adc6ff' }}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Space align="center">
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%', background: '#1890ff',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20
                            }}>
                                🎉
                            </div>
                            <div>
                                <Text strong style={{ fontSize: 16 }}>
                                    {pendingRequests.length === 0 ? "Hurray! No pending leave requests" : `You have ${pendingRequests.length} pending leave request(s)`}
                                </Text>
                                <div><Text type="secondary">Request leave on the right!</Text></div>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Space direction="vertical" align="end">
                            <Button type="primary" size="large" onClick={onRequestLeave}>Request Leave</Button>
                            <div style={{ fontSize: 12 }}>
                                <Space>
                                    <a href="#">Request Credit for Comp Off</a>
                                    <a href="#">Leave Policy</a>
                                </Space>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Stats Section */}
            <h3 style={{ marginBottom: 16 }}>My Leave Stats</h3>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={8}>
                    <Card title="Weekly Pattern" size="small">
                        <div style={{ height: 150 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="days" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="Consumed Leave Types" size="small">
                        <div style={{ height: 150 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {typeData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 10 }} />
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="Monthly Stats" size="small">
                        <div style={{ height: 150 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="days" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Balances Section */}
            <h3 style={{ marginBottom: 16 }}>Leave Balances</h3>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={6}>
                    <Card title="Comp Offs" extra={<a href="#">View details</a>} size="small" style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Title level={4}>Infinite</Title>
                            <Text type="secondary">Balance</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>AVAILABLE</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>CONSUMED</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>∞</Text>
                            <Text strong>0 days</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card title="Overseas Trip" extra={<a href="#">View details</a>} size="small" style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Title level={4}>3 Year</Title>
                            <Text type="secondary">Service Rule</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>AVAILABLE</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>CONSUMED</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>{leaveBalance?.service_years >= 3 ? 'Yes' : 'No'}</Text>
                            <Text strong>0 days</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card title="Paid Leave" extra={<a href="#">View details</a>} size="small" style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <Progress type="circle" percent={Math.round(((15 - (leaveBalance?.paid_leave_used || 0)) / 15) * 100)} format={() => `${15 - (leaveBalance?.paid_leave_used || 0)} Days`} width={80} strokeColor="#1890ff" />
                            <div style={{ marginTop: 8 }}><Text type="secondary">Available</Text></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                            <div style={{ fontSize: 10 }}>
                                <div style={{ color: '#888' }}>ACCRUED</div>
                                <div>15 days</div>
                            </div>
                            <div style={{ fontSize: 10, textAlign: 'right' }}>
                                <div style={{ color: '#888' }}>CONSUMED</div>
                                <div>{leaveBalance?.paid_leave_used || 0} days</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card title="Unpaid Leave" extra={<a href="#">View details</a>} size="small" style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Title level={4}>∞</Title>
                            <Text type="secondary">Allowed</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>AVAILABLE</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>CONSUMED</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>Only unpaid</Text>
                            <Text strong>0 days</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* History Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>Leave History</h3>
                <Text type="secondary">Other Leave Types Available: Birthday OR Marriage Anniversary Leave, Paternity Leave</Text>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={leaveRequests}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                />
            </Card>
        </div>
    );
}
