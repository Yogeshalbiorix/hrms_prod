
import React from 'react';
import { Modal, Row, Col, Typography, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface HolidayModalProps {
    visible: boolean;
    onClose: () => void;
    holidays: any[];
}

const HolidayModal: React.FC<HolidayModalProps> = ({ visible, onClose, holidays }) => {
    const currentYear = dayjs().year();

    // Color palette for the date boxes matches the screenshot style
    // We can cycle through these or map them to months
    const colors = [
        { bg: '#e6f7ff', text: '#1890ff', border: '#91d5ff' }, // Blue
        { bg: '#fff0f6', text: '#eb2f96', border: '#ffadd2' }, // Pink
        { bg: '#f9f0ff', text: '#722ed1', border: '#d3adf7' }, // Purple
        { bg: '#fff7e6', text: '#fa8c16', border: '#ffd591' }, // Orange
        { bg: '#f6ffed', text: '#52c41a', border: '#b7eb8f' }, // Green
        { bg: '#e6fffb', text: '#13c2c2', border: '#87e8de' }, // Cyan
        { bg: '#fff1b8', text: '#d48806', border: '#ffe58f' }, // Yellow
        { bg: '#fff2e8', text: '#fa541c', border: '#ffbb96' }, // Volcano
    ];

    const getHolidayColor = (index: number) => {
        return colors[index % colors.length];
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text style={{ fontSize: '18px' }}>Holidays</Text>
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px' }}>
                        <Button type="text" icon={<LeftOutlined />} disabled />
                        <Text strong style={{ margin: '0 8px' }}>{currentYear}</Text>
                        <Button type="text" icon={<RightOutlined />} />
                    </div>
                </div>
            }
            styles={{ body: { padding: '24px', maxHeight: '600px', overflowY: 'auto' } }}
        >
            <Row gutter={[24, 24]}>
                {holidays.map((holiday, index) => {
                    const date = dayjs(holiday.date);
                    const color = getHolidayColor(index);

                    return (
                        <Col xs={24} sm={12} key={index}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {/* Date Box */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '60px',
                                    height: '60px',
                                    backgroundColor: color.bg,
                                    border: `1px solid ${color.border}`,
                                    borderRadius: '6px',
                                    flexShrink: 0
                                }}>
                                    <Text style={{
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        backgroundColor: color.text,
                                        width: '100%',
                                        textAlign: 'center',
                                        borderTopLeftRadius: '4px',
                                        borderTopRightRadius: '4px',
                                        padding: '2px 0'
                                    }}>
                                        {date.format('MMM').toUpperCase()}
                                    </Text>
                                    <Text style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#333',
                                        lineHeight: '1.2',
                                        marginTop: '2px'
                                    }}>
                                        {date.format('DD')}
                                    </Text>
                                </div>

                                {/* Holiday Details */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Text style={{ fontSize: '16px', fontWeight: 500, color: '#262626' }}>
                                        {holiday.name}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                        {date.format('dddd')}
                                    </Text>
                                </div>
                            </div>
                        </Col>
                    );
                })}
            </Row>

            {holidays.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">No holidays found for this year.</Text>
                </div>
            )}
        </Modal>
    );
};

export default HolidayModal;
