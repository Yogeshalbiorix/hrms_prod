import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  App,
  Space,
  Result,
  Spin
} from 'antd';
import {
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface ResetPasswordPageProps {
  token?: string;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token: propToken,
  onSuccess,
  onBackToLogin
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [token, setToken] = useState(propToken);
  const [form] = Form.useForm();

  useEffect(() => {
    // If token not provided as prop, try to get from URL
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setToken(urlToken);
      } else {
        setTokenError(true);
      }
    }
  }, [token]);

  const handleSubmit = async (values: any) => {
    if (!token) {
      message.error('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        message.success('Password reset successfully!');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (onBackToLogin) {
            onBackToLogin();
          }
        }, 2000);
      } else {
        message.error((data as any).error || 'Failed to reset password');
        if ((data as any).error?.includes('Invalid or expired')) {
          setTokenError(true);
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      message.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show error if token is missing or invalid
  if (tokenError) {
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
            status="error"
            icon={<CloseCircleOutlined />}
            title="Invalid Reset Link"
            subTitle="This password reset link is invalid or has expired. Please request a new one."
            extra={[
              <Button
                type="primary"
                key="login"
                onClick={onBackToLogin}
              >
                Back to Login
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  // Show success message after reset
  if (resetSuccess) {
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
            icon={<CheckCircleOutlined />}
            title="Password Reset Successful"
            subTitle="Your password has been changed. You can now login with your new password."
            extra={[
              <Button
                type="primary"
                key="login"
                onClick={onBackToLogin}
              >
                Go to Login
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  // Show loading if no token yet
  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Spin size="large" />
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
              Reset Password
            </Title>
            <Paragraph type="secondary">
              Enter your new password below.
            </Paragraph>
          </div>

          <Form
            form={form}
            name="reset_password"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
                {
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                  message: 'Password must contain letters and numbers'
                }
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              label="Confirm New Password"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
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
                Reset Password
              </Button>
            </Form.Item>
          </Form>

          <Button
            type="link"
            onClick={onBackToLogin}
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

export default ResetPasswordPage;
