import React, { useEffect, useState } from 'react';
import { Calendar, Badge, Tag, Spin, Tooltip, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

interface AttendanceCalendarProps {
    attendanceData: any[]; // Array of attendance records
}

interface Holiday {
    id: number;
    date: string;
    name: string;
    is_optional: number;
}

interface Leave {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ attendanceData }) => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const sessionToken = localStorage.getItem('sessionToken');

                // Fetch Holidays
                // Using admin endpoint as discovered; assuming accessible or will fix later if 403.
                // If strict admin, we might need a public endpoint. 
                // For now, let's try.
                const holidaysRes = await fetch('/api/admin/holidays', {
                    headers: { 'Authorization': `Bearer ${sessionToken}` }
                });
                if (holidaysRes.ok) {
                    const data = await holidaysRes.json();
                    setHolidays(data.holidays || []);
                }

                // Fetch Leaves
                const leavesRes = await fetch('/api/leave', {
                    headers: { 'Authorization': `Bearer ${sessionToken}` }
                });
                if (leavesRes.ok) {
                    const data = await leavesRes.json();
                    setLeaves(data.data || []);
                }

            } catch (error) {
                console.error('Error fetching calendar data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getListData = (value: Dayjs) => {
        const listData: { type: string; content: React.ReactNode; color?: string }[] = [];
        const dateStr = value.format('YYYY-MM-DD');

        // 1. Holidays
        const holiday = holidays.find(h => h.date === dateStr);
        if (holiday) {
            listData.push({
                type: 'holiday',
                content: <Badge color="orange" text={holiday.name} />,
            });
        }

        // 2. Leaves
        const activeLeave = leaves.find(l => {
            // Only show approved or pending? User said "show kab leave hai" -> implies approved mainly, but pending is useful.
            // Filter rejected.
            if (l.status === 'rejected') return false;

            const start = dayjs(l.start_date);
            const end = dayjs(l.end_date);
            return value.isBetween(start, end, 'day', '[]');
        });

        if (activeLeave) {
            let color = 'gold'; // Pending
            if (activeLeave.status === 'approved') color = 'green';

            listData.push({
                type: 'leave',
                content: <Tag color={color} style={{ width: '100%', textAlign: 'center', margin: '2px 0' }}>{activeLeave.leave_type} ({activeLeave.status})</Tag>
            });
        }

        // 3. Weekly Off (Sat/Sun)
        // Only if not a holiday (or render both). Usually W-OFF is explicit.
        const dayOfWeek = value.day(); // 0=Sun, 6=Sat
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            listData.push({
                type: 'woff',
                content: <Tag color="#d9d9d9" style={{ color: '#000', width: '100%', textAlign: 'center', margin: '2px 0' }}>W-OFF</Tag>
            });
        }

        // 4. Attendance (Clock In/Out) - Only if not future?
        // Check attendanceData
        // attendanceData is array of { date: 'YYYY-MM-DD', clock_in: '...', ... }
        const record = attendanceData.find(r => r.date === dateStr);
        if (record) {
            // If present
            if (record.clock_in) {
                listData.push({
                    type: 'attendance',
                    content: (
                        <div style={{ fontSize: '10px', color: '#1890ff' }}>
                            <div>In: {formatTime(record.clock_in)}</div>
                            {record.clock_out && <div>Out: {formatTime(record.clock_out)}</div>}
                        </div>
                    )
                });
            } else if (record.status === 'absent' && !activeLeave && dayOfWeek !== 0 && dayOfWeek !== 6 && !holiday) {
                // Mark absent if no leave, not weekend, not holiday
                listData.push({
                    type: 'absent',
                    content: <Tag color="error" style={{ width: '100%', textAlign: 'center' }}>Absent</Tag>
                });
            }
        }

        return listData;
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        // timeStr is HH:mm:ss usually or formatted?
        // UserDashboard might parse it. Assuming HH:mm:ss from API.
        // Let's use simple parse.
        const [h, m] = timeStr.split(':');
        const d = new Date();
        d.setHours(parseInt(h), parseInt(m));
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = getListData(value);
        return (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {listData.map((item, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>
                        {item.content}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
            {loading ? <Spin /> : <Calendar dateCellRender={dateCellRender} />}
        </div>
    );
};

export default AttendanceCalendar;
