import React from 'react';
import { Card, Statistic, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { LucideIcon } from 'lucide-react';

const { Text } = Typography;

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export default function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue'
}: StatsCardProps) {
  const colorConfig = {
    blue: { bg: '#e6f4ff', color: '#1890ff' },
    green: { bg: '#f6ffed', color: '#52c41a' },
    yellow: { bg: '#fffbe6', color: '#faad14' },
    red: { bg: '#fff1f0', color: '#ff4d4f' },
    purple: { bg: '#f9f0ff', color: '#722ed1' },
  };

  const config = colorConfig[color];

  return (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-shadow"
      bodyStyle={{ padding: '24px' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text type="secondary" className="text-sm">
            {title}
          </Text>
          <Statistic
            value={value}
            valueStyle={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}
          />
          {change && (
            <Space size={4} className="mt-2">
              {trend === 'up' ? (
                <ArrowUpOutlined style={{ color: '#52c41a' }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
              )}
              <Text
                style={{
                  color: trend === 'up' ? '#52c41a' : '#ff4d4f',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {change}
              </Text>
            </Space>
          )}
        </div>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: config.bg,
            color: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}
