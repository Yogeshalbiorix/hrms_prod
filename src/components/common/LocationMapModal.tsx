import React, { useEffect, useRef, useState } from 'react';
import { Modal, Spin, Button, Typography, Space, Row, Col, Divider } from 'antd';
import { EnvironmentOutlined, ReloadOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { loadGoogleMapsScript } from '../../lib/maps';

interface LocationMapModalProps {
    visible: boolean;
    onClose: () => void;
    latitude: number;
    longitude: number;
    address?: string;
    title: string; // e.g., "Web Clock In" or "Web Clock Out"
    timestamp?: string; // e.g., "11:10 AM"
    userName?: string;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
    visible,
    onClose,
    latitude,
    longitude,
    address,
    title,
    timestamp,
    userName
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setLoading(true);
            setError(null);

            loadGoogleMapsScript()
                .then(() => {
                    setLoading(false);
                    // Small delay to ensure container is ready
                    setTimeout(initMap, 100);
                })
                .catch((err) => {
                    console.error('Failed to load Google Maps script', err);
                    setError('Failed to load Google Maps. Please check connection.');
                    setLoading(false);
                });
        }
    }, [visible, latitude, longitude]);

    const initMap = () => {
        if (!mapRef.current || !window.google) return;

        try {
            const position = { lat: latitude, lng: longitude };

            const map = new window.google.maps.Map(mapRef.current, {
                center: position,
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
            });

            new window.google.maps.Marker({
                position: position,
                map: map,
                title: address || 'Location',
                animation: window.google.maps.Animation.DROP,
            });

        } catch (e) {
            console.error('Error initializing map:', e);
            setError('Error initializing map.');
        }
    };

    // Format today's date for the header
    const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const headerText = `MAP VIEW - ${todayDate} - ${userName ? userName.toUpperCase() : 'USER'}`;

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            title={headerText}
            width="100%"
            styles={{ body: { padding: 0 } }}
            style={{ top: 0, padding: 0, maxWidth: '100vw' }}
            centered
            destroyOnClose
        >
            <div style={{ display: 'flex', height: '90vh', width: '100%', position: 'relative' }}>

                {/* Left Sidebar (Light Theme) */}
                <div style={{ width: '300px', backgroundColor: '#ffffff', padding: '24px', color: '#1e293b', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' }}>

                    <div style={{ marginBottom: '32px' }}>
                        <Typography.Text style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                            {title.toUpperCase()}
                        </Typography.Text>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                            <ClockCircleOutlined style={{ color: '#22c55e', marginRight: '8px', fontSize: '12px' }} />
                            <Typography.Text style={{ color: '#1e293b', fontSize: '14px', fontWeight: 'bold' }}>
                                {timestamp || '--:--'}
                            </Typography.Text>
                        </div>

                        {address && (
                            <div style={{ paddingLeft: '20px' }}>
                                <Typography.Text style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
                                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                                </Typography.Text>
                            </div>
                        )}
                    </div>

                    {/* Missing or Status Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#ef4444', marginRight: '8px', fontSize: '12px' }}>↗</span>
                        <Typography.Text style={{ color: '#ef4444', fontSize: '11px' }}>
                            MISSING
                        </Typography.Text>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <Divider style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />
                        {address && (
                            <div>
                                <Typography.Text style={{ color: '#64748b', fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                                    CAPTURED ADDRESS
                                </Typography.Text>
                                <Typography.Text style={{ color: '#334155', fontSize: '12px', lineHeight: '1.4' }}>
                                    {address}
                                </Typography.Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Map Content */}
                <div style={{ flex: 1, position: 'relative', backgroundColor: '#f1f5f9' }}>
                    {loading && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            zIndex: 10, background: 'rgba(255,255,255,0.8)'
                        }}>
                            <Spin tip="Loading Map..." />
                        </div>
                    )}

                    {error ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ff4d4f' }}>
                            <EnvironmentOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                            <Typography.Text type="danger">{error}</Typography.Text>
                            <Button type="primary" onClick={() => { setLoading(true); initMap(); }} icon={<ReloadOutlined />} style={{ marginTop: '16px' }}>Retry</Button>
                        </div>
                    ) : (
                        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default LocationMapModal;
