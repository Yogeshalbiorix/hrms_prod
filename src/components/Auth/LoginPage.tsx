import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Space,
  Divider,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined
} from '@ant-design/icons';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';

const { Title, Text, Link } = Typography;

type ViewMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [form] = Form.useForm();

  // Check if we're on reset password page (from URL)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      setViewMode('reset-password');
    }
  }, []);

  const handleSubmit = async (values: any) => {
    setError('');
    setLoading(true);

    const result = await login(values.username, values.password);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  // Show different views based on mode
  if (viewMode === 'register') {
    return (
      <RegisterPage
        onSuccess={() => setViewMode('login')}
        onLoginClick={() => setViewMode('login')}
      />
    );
  }

  if (viewMode === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onBackToLogin={() => setViewMode('login')}
      />
    );
  }

  if (viewMode === 'reset-password') {
    return (
      <ResetPasswordPage
        onSuccess={() => setViewMode('login')}
        onBackToLogin={() => setViewMode('login')}
      />
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
          {/* Logo and Title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 16,
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: 28 }}>HR</span>
            </div>
            <Title level={2} style={{ marginBottom: 8 }}>
              Welcome to HRMS
            </Title>
            <Text type="secondary">
              Sign in to access your dashboard
            </Text>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
            />
          )}

          {/* Login Form */}
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item>
              <Row justify="space-between" align="middle">
                <Col>
                  {/* Future: Remember me checkbox */}
                </Col>
                <Col>
                  <Link onClick={() => setViewMode('forgot-password')}>
                    Forgot password?
                  </Link>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<LoginOutlined />}
                block
                size="large"
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>
            <Text type="secondary">Don't have an account?</Text>
          </Divider>

          <Button
            type="default"
            onClick={() => setViewMode('register')}
            block
            size="large"
          >
            Create Account
          </Button>
        </Space>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © 2025 HRMS. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
}
