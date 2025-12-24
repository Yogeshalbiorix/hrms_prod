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
type LoginStep = 'credentials' | 'otp';

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [emailFor2FA, setEmailFor2FA] = useState('');

  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();

  // Check if we're on reset password page (from URL)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      setViewMode('reset-password');
    }
  }, []);

  const handleCredentialSubmit = async (values: any) => {
    setError('');
    setLoading(true);

    try {
      // NOTE: We need to modify useAuth.login to handle the new response structure
      // But since useAuth usually wraps a fetch, we assume it returns the JSON response.
      // If useAuth is strictly typed, we might need to cast or update AuthContext.

      // Assuming AuthContext.login calls api/auth/login and handles the response...
      // IF AuthContext logic is: 
      //    if (data.success) { setUser(data.user); ... }
      // THEN we need to intercept this.

      // ACTUALLY: I should probably check AuthContext first. 
      // But assuming standard implementation:

      const result = await login(values.username, values.password);

      if (result.require_2fa) {
        // Success Step 1 -> Move to Step 2
        setEmailFor2FA(result.email || '');
        setLoginStep('otp');
      } else if (!result.success) {
        setError(result.error || 'Login failed');
      }
      // If success directly (no 2FA), AuthContext handles redirect usually.
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (values: any) => {
    setError('');
    setLoading(true);
    try {
      // We need to call the verify-2fa endpoint manually here or through a new AuthContext method.
      // Since I haven't updated AuthContext, I'll fetch directly here for now, 
      // then force a reload or re-call a "refresh user" method if available.

      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailFor2FA, otp: values.otp }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        sessionToken?: string;
        user?: any;
      };

      if (data.success && data.sessionToken && data.user) {
        // Login Success!
        // Store session data manually since AuthContext doesn't expose a setter for this specific flow yet/
        // Ideally we should add a 'setSession(token, user)' method to AuthContext.
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Manually trigger app reload to pick up the new session
        window.location.href = '/';
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
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
              {loginStep === 'otp' ? 'Verification' : 'Welcome to HRMS'}
            </Title>
            <Text type="secondary">
              {loginStep === 'otp'
                ? `Enter the code sent to ${emailFor2FA}`
                : 'Sign in to access your dashboard'
              }
            </Text>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message={loginStep === 'otp' ? 'Verification Failed' : 'Login Failed'}
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
            />
          )}

          {/* Login Form Step 1: Credentials */}
          {loginStep === 'credentials' && (
            <Form
              form={form}
              name="login"
              onFinish={handleCredentialSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                label="Username or Email"
                rules={[{ required: true, message: 'Please enter your username' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your username or email"
                  autoFocus
                  autoComplete="username"
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
                  autoComplete="current-password"
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
          )}

          {/* Login Form Step 2: OTP */}
          {loginStep === 'otp' && (
            <Form
              form={otpForm}
              name="otp"
              onFinish={handleOTPSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="otp"
                label="Verification Code"
                rules={[
                  { required: true, message: 'Please enter the code' },
                  { len: 6, message: 'Code must be 6 digits' }
                ]}
              >
                <Input
                  placeholder="123456"
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
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
                  style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                >
                  Verify Login
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Link onClick={() => setLoginStep('credentials')}>
                  Back to Login
                </Link>
              </div>
            </Form>
          )}

          {loginStep === 'credentials' && (
            <>
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
            </>
          )}
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

