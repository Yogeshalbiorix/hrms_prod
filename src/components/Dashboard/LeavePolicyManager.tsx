import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Input, Modal, Form, DatePicker, Switch, message, Typography, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function LeavePolicyManager() {
    const [activeTab, setActiveTab] = useState('guidelines');
    const [policyText, setPolicyText] = useState('');
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [holidayModalVisible, setHolidayModalVisible] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<any>(null);
    const [form] = Form.useForm();

    // Fetch Logic
    const fetchPolicy = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json() as any;
            if (data.text) setPolicyText(data.text);
        } catch (err) {
            message.error('Failed to load policy');
        } finally {
            setLoading(false);
        }
    };

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/holidays');
            const data = await res.json() as any;
            if (data.holidays) setHolidays(data.holidays);
        } catch (err) {
            message.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'guidelines') fetchPolicy();
        if (activeTab === 'holidays') fetchHolidays();
    }, [activeTab]);

    // Save Policy
    const handleSavePolicy = async () => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ text: policyText }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) message.success('Policy updated successfully');
            else message.error('Failed to update policy');
        } catch (err) {
            message.error('Error saving policy');
        }
    };

    // Add or Update Holiday
    const handleAddHoliday = async (values: any) => {
        try {
            const payload = {
                id: editingHoliday ? editingHoliday.id : undefined,
                name: values.name,
                date: values.date.format('YYYY-MM-DD'),
                year: values.date.year(),
                is_optional: values.is_optional
            };

            const method = editingHoliday ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/holidays', {
                method: method,
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                message.success(editingHoliday ? 'Holiday updated' : 'Holiday added');
                setHolidayModalVisible(false);
                setEditingHoliday(null);
                form.resetFields();
                fetchHolidays();
            } else {
                message.error('Failed to save holiday');
            }
        } catch (err) {
            message.error('Error saving holiday');
        }
    };

    const handleEditHoliday = (record: any) => {
        setEditingHoliday(record);
        form.setFieldsValue({
            name: record.name,
            date: dayjs(record.date),
            is_optional: !!record.is_optional
        });
        setHolidayModalVisible(true);
    };

    // Delete Holiday
    const handleDeleteHoliday = async (id: number) => {
        try {
            await fetch(`/api/admin/holidays?id=${id}`, { method: 'DELETE' });
            message.success('Holiday deleted');
            fetchHolidays();
        } catch (err) {
            message.error('Error deleting holiday');
        }
    };

    const holidayColumns = [
        { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Day', dataIndex: 'date', key: 'day', render: (d: string) => dayjs(d).format('dddd') },
        { title: 'Holiday Name', dataIndex: 'name', key: 'name' },
        { title: 'Type', dataIndex: 'is_optional', key: 'is_optional', render: (opt: number) => opt ? 'Optional' : 'Mandatory' },
        {
            title: 'Action', key: 'action', render: (_: any, r: any) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEditHoliday(r)} />
                    <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDeleteHoliday(r.id)} />
                </Space>
            )
        }
    ];

    return (
        <Card title="Leave Policy Management" bordered={false}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: 'guidelines',
                    label: 'Policy Guidelines',
                    children: (
                        <div>
                            <div style={{ marginBottom: 16, background: '#e6f7ff', padding: 10, borderRadius: 4, border: '1px solid #91d5ff' }}>
                                <Typography.Text strong>Note:</Typography.Text> Supports HTML tags for formatting (e.g. &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;).
                            </div>
                            <TextArea
                                rows={20}
                                value={policyText}
                                onChange={(e) => setPolicyText(e.target.value)}
                                style={{ fontFamily: 'monospace' }}
                            />
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSavePolicy}>Save Policy</Button>
                            </div>
                        </div>
                    )
                },
                {
                    key: 'holidays',
                    label: 'Public Holidays',
                    children: (
                        <div>
                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                    setEditingHoliday(null);
                                    form.resetFields();
                                    setHolidayModalVisible(true);
                                }}>Add Holiday</Button>
                            </div>
                            <Table
                                dataSource={holidays}
                                columns={holidayColumns}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 12 }}
                            />
                        </div>
                    )
                }
            ]} />

            <Modal
                title={editingHoliday ? "Edit Public Holiday" : "Add Public Holiday"}
                open={holidayModalVisible}
                onCancel={() => setHolidayModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} onFinish={handleAddHoliday} layout="vertical">
                    <Form.Item name="name" label="Holiday Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Diwali" />
                    </Form.Item>
                    <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>
                    <Form.Item name="is_optional" label="Optional Holiday" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
