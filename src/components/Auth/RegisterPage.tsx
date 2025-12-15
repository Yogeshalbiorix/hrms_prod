import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Space,
  Divider,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  BankOutlined
} from '@ant-design/icons';

const { Title, Text, Link } = Typography;

interface RegisterPageProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onLoginClick }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleRegister = async (values: any) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          email: values.email,
          full_name: values.full_name,
          phone: values.phone,
          position: values.position,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Registration successful! You can now login.');
        form.resetFields();

        // Wait a moment before calling onSuccess or redirecting
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (onLoginClick) {
            onLoginClick();
          }
        }, 1500);
      } else {
        message.error((data as any).error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: 600,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          borderRadius: 12
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              Create Account
            </Title>
            <Text type="secondary">
              Join our HRMS platform
            </Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={handleRegister}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="full_name"
                  label="Full Name"
                  rules={[
                    { required: true, message: 'Please enter your full name' },
                    { min: 2, message: 'Name must be at least 2 characters' }
                  ]}
                >
                  <Input
                    prefix={<IdcardOutlined />}
                    placeholder="John Doe"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: 'Please enter a username' },
                    { min: 3, message: 'Username must be at least 3 characters' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, and underscores allowed' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="johndoe"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="john@example.com"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[
                    { pattern: /^[0-9+\-\s()]+$/, message: 'Invalid phone number' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="+1 (555) 123-4567"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="position"
                  label="Position"
                >
                  <Input
                    prefix={<BankOutlined />}
                    placeholder="Software Engineer"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter a password' },
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
                    placeholder="Enter password"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirm_password"
                  label="Confirm Password"
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
                    placeholder="Confirm password"
                  />
                </Form.Item>
              </Col>
            </Row>

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
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>
            <Text type="secondary">Already have an account?</Text>
          </Divider>

          <Button
            type="link"
            onClick={onLoginClick}
            block
            style={{ fontSize: 16 }}
          >
            Sign In
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default RegisterPage;
