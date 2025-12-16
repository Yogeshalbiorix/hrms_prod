import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, Divider } from 'antd';
import { MailOutlined, UserOutlined } from '@ant-design/icons';
import OTPInput from './OTPInput';

const OTPDemo: React.FC = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [purpose, setPurpose] = useState<'login' | 'registration' | 'password_reset' | 'email_verification'>('login');

  const handleSendOTP = (values: any) => {
    setUserEmail(values.email);
    setUserName(values.name);
    setShowOTP(true);
  };

  const handleVerified = () => {
    console.log('OTP Verified successfully!');
    alert('✅ OTP Verified! You can now proceed.');
    setShowOTP(false);
    setUserEmail('');
    setUserName('');
  };

  if (showOTP) {
    return (
      <OTPInput
        email={userEmail}
        userName={userName}
        purpose={purpose}
        onVerified={handleVerified}
        onCancel={() => setShowOTP(false)}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          maxWidth: '500px',
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>📧</div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>OTP Verification Demo</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Test the email OTP functionality
          </p>
        </div>

        <Form
          layout="vertical"
          onFinish={handleSendOTP}
          initialValues={{
            email: 'yogesh.albiorix@gmail.com',
            name: 'Yogesh Purnawasi'
          }}
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="your.email@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Your Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your name"
              size="large"
            />
          </Form.Item>

          <Form.Item label="Purpose">
            <Space wrap>
              <Button
                type={purpose === 'login' ? 'primary' : 'default'}
                onClick={() => setPurpose('login')}
              >
                Login
              </Button>
              <Button
                type={purpose === 'registration' ? 'primary' : 'default'}
                onClick={() => setPurpose('registration')}
              >
                Registration
              </Button>
              <Button
                type={purpose === 'email_verification' ? 'primary' : 'default'}
                onClick={() => setPurpose('email_verification')}
              >
                Email Verify
              </Button>
              <Button
                type={purpose === 'password_reset' ? 'primary' : 'default'}
                onClick={() => setPurpose('password_reset')}
              >
                Password Reset
              </Button>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                height: '50px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Send OTP
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{
          background: '#f0f4ff',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
            📝 How it works:
          </div>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Enter your email and name</li>
            <li>Click "Send OTP"</li>
            <li>Check your email for the 6-digit code</li>
            <li>Enter the OTP to verify</li>
          </ol>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
            💡 If EmailJS is not configured, the OTP will be shown in the browser console for testing.
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OTPDemo;
