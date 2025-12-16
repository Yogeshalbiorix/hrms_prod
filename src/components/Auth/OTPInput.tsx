import React, { useState, useRef, useEffect } from 'react';
import { message } from 'antd';
import { baseUrl } from '../../lib/base-url';

interface OTPInputProps {
  email: string;
  userName: string;
  purpose?: 'login' | 'registration' | 'password_reset' | 'email_verification';
  onVerified: () => void;
  onCancel?: () => void;
}

const OTPInput: React.FC<OTPInputProps> = ({
  email,
  userName,
  purpose = 'login',
  onVerified,
  onCancel
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Send initial OTP
  useEffect(() => {
    sendOTP();
  }, []);

  const sendOTP = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: userName, purpose })
      });

      const result = await response.json() as {
        success?: boolean;
        otp?: string;
        message?: string;
      };

      if (result.success) {
        message.success('OTP sent to your email!');
        // For testing when EmailJS is not configured, log the OTP
        if (result.otp) {
          console.log('🔢 Test OTP:', result.otp);
          message.info(`Test OTP (check console): ${result.otp}`, 5);
        }
      } else {
        message.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      message.error('Failed to send OTP. Please try again.');
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && !newOtp.includes('')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) {
      message.warning('Please paste only numbers');
      return;
    }

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);

    // Focus on next empty input or last input
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
      // Auto-verify if all filled
      if (newOtp.every(digit => digit !== '')) {
        verifyOTP(newOtp.join(''));
      }
    }
  };

  const verifyOTP = async (otpValue: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });

      const result = await response.json() as {
        valid?: boolean;
        message?: string;
      };

      if (result.valid) {
        message.success('OTP verified successfully!');
        onVerified();
      } else {
        message.error(result.message || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      message.error('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: userName, purpose })
      });

      const result = await response.json() as {
        success?: boolean;
        message?: string;
      };

      if (result.success) {
        message.success('New OTP sent to your email!');
        setOtp(['', '', '', '', '', '']);
        setTimer(60);
        setCanResend(false);
        inputRefs.current[0]?.focus();
      } else {
        message.error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      message.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔐</div>
        <h2 style={{ margin: '0 0 10px 0', color: 'white' }}>Verify Your Email</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          We've sent a 6-digit OTP to<br />
          <strong>{email}</strong>
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <p style={{
          color: '#666',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          Enter the 6-digit code sent to your email
        </p>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={loading}
              style={{
                width: '50px',
                height: '60px',
                fontSize: '24px',
                textAlign: 'center',
                border: '2px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.3s',
                fontWeight: 'bold',
                ...(digit && {
                  borderColor: '#667eea',
                  background: '#f0f4ff'
                })
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                if (!digit) {
                  e.target.style.borderColor = '#ddd';
                }
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        {loading && (
          <div style={{ color: '#667eea', fontSize: '14px' }}>
            Verifying OTP...
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        {!canResend ? (
          <p style={{ color: '#999', fontSize: '14px' }}>
            Resend OTP in <strong style={{ color: '#667eea' }}>{timer}s</strong>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resendLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'underline',
              padding: '5px 10px'
            }}
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
        )}
      </div>

      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        textAlign: 'left'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
          ⚠️ Important:
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '13px',
          color: '#666'
        }}>
          <li>OTP is valid for 10 minutes</li>
          <li>Don't share this code with anyone</li>
          <li>Check your spam folder if not received</li>
        </ul>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid #ddd',
            color: '#666',
            padding: '10px 30px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default OTPInput;
