
import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, Avatar, List, Tabs, Input, Statistic, Divider, Space, Tag, Empty, Badge } from 'antd';
import {
    ClockCircleOutlined,
    CalendarOutlined,
    TeamOutlined,
    GiftOutlined,
    SoundOutlined,
    EditOutlined,
    BellOutlined,
    RightOutlined,
    RocketOutlined,
    CoffeeOutlined,
    LaptopOutlined,
    UserOutlined,
    PlusOutlined,
    LikeOutlined,
    MessageOutlined,
    ShareAltOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DashboardHomeProps {
    user: any;
    attendanceData: any;
    leaveBalance: any;
    holidays: any[];
    isClockedIn: boolean;
    elapsedTime: number;
    onClockIn: () => void;
    onClockOut: () => void;
    onViewAllLeaves: () => void;
    onViewAllHolidays: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
    user,
    attendanceData,
    leaveBalance,
    holidays,
    isClockedIn,
    elapsedTime,
    onClockIn,
    onClockOut,
    onViewAllLeaves,
    onViewAllHolidays
}) => {
    const [postContent, setPostContent] = useState('');

    // Mock Data for "Working Remotely"
    const workingRemotely = {
        count: 0,
        text: "Everyone is at office!",
        subtext: "No one is working remotely today"
    };

    // Mock Data for "Inbox"
    const inboxItems: any[] = [
        // Example: { id: 1, title: 'Approve Leave', description: 'Rahul accepted leave', type: 'action' }
    ];

    // Helper to format elapsed time
    const formatElapsedTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Get next upcoming holiday
    const upcomingHoliday = holidays && holidays.length > 0
        ? holidays.filter(h => dayjs(h.date).isAfter(dayjs())).sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())[0]
        : null;

    return (
        <div style={{ padding: '0 24px 24px 24px' }}>
            {/* Welcome Banner */}
            <div
                style={{
                    background: 'linear-gradient(90deg, #1c2e4a 0%, #2b4b7c 100%)',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '24px',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                    // Add background image pattern if possible
                }}
            >
                <div style={{ zIndex: 1 }}>
                    <Title level={2} style={{ color: 'white', marginBottom: 0 }}>
                        Welcome {user?.full_name || user?.username || 'User'}!
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {getGreeting()}
                    </Text>
                </div>
                {/* Abstract background shapes could be added here as SVG */}
            </div>

            <Row gutter={[24, 24]}>
                {/* Left Column */}
                <Col xs={24} md={10} lg={8}>
                    <Space direction="vertical" size={24} style={{ width: '100%' }}>

                        {/* Inbox */}
                        <Card title="Inbox" size="small" extra={<Badge count={inboxItems.length} />}>
                            {inboxItems.length > 0 ? (
                                <List
                                    dataSource={inboxItems}
                                    renderItem={(item: any) => (
                                        <List.Item><Text>{item.title}</Text></List.Item>
                                    )}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <RocketOutlined style={{ fontSize: '32px', color: '#d9d9d9', marginBottom: '8px' }} />
                                    <div style={{ fontWeight: 500 }}>Good Job!</div>
                                    <Text type="secondary">You have no pending actions</Text>
                                </div>
                            )}
                        </Card>

                        {/* Working Remotely */}
                        <Card title="Working Remotely" size="small">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ display: 'block' }}>{workingRemotely.text}</Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>{workingRemotely.subtext}</Text>
                                </div>
                                <Avatar.Group maxCount={3}>
                                    {/* Render avatars if any */}
                                </Avatar.Group>
                                <LaptopOutlined style={{ fontSize: '48px', color: '#e6f7ff' }} />
                            </div>
                        </Card>

                        {/* Time Today */}
                        <Card
                            size="small"
                            style={{ background: '#f6f0ff', borderColor: '#d3adf7' }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <Text type="secondary">Time Today - {dayjs().format('ddd, DD MMM YYYY')}</Text>
                                <Button type="link" size="small" style={{ padding: 0 }}>View All</Button>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>CURRENT TIME</Text>
                                <Title level={2} style={{ margin: 0, color: '#391085' }}>
                                    {dayjs().format('HH:mm')} <span style={{ fontSize: '16px' }}>{dayjs().format('A')}</span>
                                </Title>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {!isClockedIn ? (
                                    <Button type="primary" shape="round" onClick={onClockIn}>Web Clock-in</Button>
                                ) : (
                                    <Button type="primary" danger shape="round" onClick={onClockOut}>Clock-out</Button>
                                )}
                                {isClockedIn && (
                                    <div style={{ textAlign: 'right' }}>
                                        <Text type="secondary" style={{ fontSize: '10px' }}>LOGGED IN</Text>
                                        <div style={{ fontWeight: 'bold' }}>{formatElapsedTime(elapsedTime)}</div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Leave Balances */}
                        <Card title="Leave Balances" size="small">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #1890ff',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 8px'
                                    }}>
                                        <span style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1 }}>
                                            {leaveBalance ? (leaveBalance.paid_leave_quota - leaveBalance.paid_leave_used) : 0}
                                        </span>
                                        <span style={{ fontSize: '10px' }}>Days</span>
                                    </div>
                                    <Text style={{ fontSize: '12px' }}>PAID LEAVE</Text>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <Button type="link" onClick={onViewAllLeaves}>Request Leave</Button>
                                    <Button type="link" onClick={onViewAllLeaves}>View All Balances</Button>
                                </div>
                            </div>
                        </Card>

                        {/* Holidays */}
                        <Card
                            size="small"
                            style={{ background: '#fff7e6', borderColor: '#ffd591' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <Text strong>Holidays</Text>
                                <Button type="link" size="small" onClick={onViewAllHolidays}>View All</Button>
                            </div>

                            {upcomingHoliday ? (
                                <div>
                                    <Text style={{ fontSize: '16px', display: 'block', fontWeight: 500 }}>{upcomingHoliday.name}</Text>
                                    <Text type="secondary">{dayjs(upcomingHoliday.date).format('ddd, DD MMMM, YYYY')}</Text>
                                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                        <CalendarOutlined style={{ fontSize: '32px', color: '#ffec3d' }} />
                                    </div>
                                </div>
                            ) : (
                                <Text type="secondary">No upcoming holidays</Text>
                            )}
                        </Card>

                        {/* On Leave Today */}
                        <Card title="On Leave Today" size="small">
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {/* Mock avatars */}
                                <Avatar style={{ backgroundColor: '#87d068' }}>JV</Avatar>
                                <Avatar style={{ backgroundColor: '#1890ff' }}>V</Avatar>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>2 people are on leave today</Text>
                            </div>
                        </Card>

                    </Space>
                </Col>

                {/* Right Column */}
                <Col xs={24} md={14} lg={16}>
                    <Card bordered={false} bodyStyle={{ padding: 0 }}>
                        <Tabs defaultActiveKey="org"
                            items={[
                                {
                                    key: 'org',
                                    label: 'Organization',
                                    children: (
                                        <div>
                                            {/* Post Input */}
                                            <Card size="small" style={{ marginBottom: '24px' }}>
                                                <Tabs size="small" defaultActiveKey="post" items={[
                                                    { key: 'post', label: <span><EditOutlined /> Post</span> },
                                                    { key: 'poll', label: <span><SignalFilled /> Poll</span> },
                                                    { key: 'praise', label: <span><GiftOutlined /> Praise</span> },
                                                ]} />
                                                <TextArea
                                                    placeholder="Write your post here and mention your peers"
                                                    rows={3}
                                                    bordered={false}
                                                    style={{ resize: 'none', padding: '12px 0' }}
                                                />
                                            </Card>

                                            {/* Announcements */}
                                            <Card size="small" style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text type="secondary">No announcements</Text>
                                                    <Button type="primary" shape="circle" icon={<PlusOutlined />} size="small" />
                                                </div>
                                            </Card>

                                            {/* Events Widget */}
                                            <Card size="small" style={{ marginBottom: '24px' }}>
                                                <Tabs defaultActiveKey="birthdays" size="small" items={[
                                                    {
                                                        key: 'birthdays',
                                                        label: <span><GiftOutlined /> Birthdays</span>,
                                                        children: (
                                                            <div style={{ padding: '12px 0', textAlign: 'center' }}>
                                                                <GiftOutlined style={{ fontSize: '48px', color: '#e6f7ff', marginBottom: '16px' }} />
                                                                <Text type="secondary" style={{ display: 'block' }}>No birthdays today</Text>

                                                                <div style={{ marginTop: '24px', textAlign: 'left' }}>
                                                                    <Text strong>Upcoming Birthdays</Text>
                                                                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <Avatar size="large" src="https://xsgames.co/randomusers/avatar.php?g=male" />
                                                                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Nirav</div>
                                                                            <div style={{ fontSize: '10px', color: '#999' }}>Tomorrow</div>
                                                                        </div>
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <Avatar size="large" style={{ backgroundColor: '#52c41a' }}>CF</Avatar>
                                                                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Chirag</div>
                                                                            <div style={{ fontSize: '10px', color: '#999' }}>04 January</div>
                                                                        </div>
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <Avatar size="large" style={{ backgroundColor: '#faad14' }}>PZ</Avatar>
                                                                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Pratik</div>
                                                                            <div style={{ fontSize: '10px', color: '#999' }}>06 January</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    },
                                                    {
                                                        key: 'anniversaries',
                                                        label: <span><RocketOutlined /> Work Anniversaries</span>,
                                                        children: <Empty description="No work anniversaries" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                                    },
                                                    {
                                                        key: 'joiners',
                                                        label: <span><TeamOutlined /> New Joiners</span>,
                                                        children: <Empty description="No new joiners" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                                    }
                                                ]} />
                                            </Card>

                                            {/* Skeleton Feed or Empty State */}
                                            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px' }}>
                                                <IllustrationPlaceholder />
                                            </div>

                                        </div>
                                    )
                                },
                                {
                                    key: 'designing',
                                    label: 'Designing'
                                }
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// Helper for poll icon
const SignalFilled = () => (
    <svg viewBox="64 64 896 896" focusable="false" data-icon="signal-filled" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M136 608h128v224H136zm256-224h128v448H392zm256-224h128v672H648z"></path></svg>
);

const IllustrationPlaceholder = () => (
    <div style={{ opacity: 0.1 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#000" d="M100,10 L120,50 L160,60 L130,90 L140,130 L100,110 L60,130 L70,90 L40,60 L80,50 Z" />
        </svg>
    </div>
);



export default DashboardHome;
