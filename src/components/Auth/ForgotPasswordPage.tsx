import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Result,
  App
} from 'antd';
import {
  MailOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ForgotPasswordPageProps {
  onBackToLogin?: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetInfo, setResetInfo] = useState<any>(null);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const data = await response.json() as any;

      if (response.ok) {
        setEmailSent(true);
        setResetInfo(data.dev_only); // For development only
        message.success('Password reset instructions sent!');
      } else {
        message.error(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            borderRadius: 12
          }}
        >
          <Result
            status="success"
            title="Check Your Email"
            subTitle="If the email exists in our system, we've sent password reset instructions."
            extra={[
              <Button
                type="primary"
                key="login"
                onClick={onBackToLogin}
                icon={<ArrowLeftOutlined />}
              >
                Back to Login
              </Button>
            ]}
          />

          {/* DEV ONLY - Remove in production */}
          {resetInfo && (
            <Alert
              message="Development Mode"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Reset Token (Dev Only):</Text>
                  <Text copyable code>{resetInfo.token}</Text>
                  <Text strong>Reset Link:</Text>
                  <Text copyable style={{ fontSize: 12, wordBreak: 'break-all' }}>
                    {resetInfo.resetLink}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Expires: {new Date(resetInfo.expiresAt).toLocaleString()}
                  </Text>
                </Space>
              }
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          borderRadius: 12
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              Forgot Password
            </Title>
            <Paragraph type="secondary">
              Enter your email address and we'll send you instructions to reset your password.
            </Paragraph>
          </div>

          <Form
            form={form}
            name="forgot_password"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="your.email@example.com"
                autoFocus
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                Send Reset Instructions
              </Button>
            </Form.Item>
          </Form>

          <Button
            type="link"
            onClick={onBackToLogin}
            icon={<ArrowLeftOutlined />}
            block
            style={{ fontSize: 16 }}
          >
            Back to Login
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
