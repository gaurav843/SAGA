/* FILEPATH: frontend/src/platform/auth/LoginScreen.tsx */
/* @file Login Screen Component (Connected) */
/* @author The Engineer */
/* @description The secure entry point for the OS.
 * MIGRATION: Swapped Material UI for Ant Design v5.
 * FEATURES:
 * - Uses Ant Design Form for layout.
 * - Enterprise styling with "Hacker Green" accents.
 * - UPDATED: Sends strict payload structure to match Level 7 Machine.
 */

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Typography, 
  Card, 
  Alert, 
  Layout, 
  Space,
  theme
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { useSelector } from '@xstate/react';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginScreen: React.FC = () => {
  const { authActor } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  
  // 1. Extract state values from the Neural Core
  const error = useSelector(authActor, (s) => s.context.error);
  const isAuthenticating = useSelector(authActor, (s) => s.matches('authenticating'));
  const isAuthenticated = useSelector(authActor, (s) => s.matches('authenticated'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. The Ejection Seat: Auto-redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = () => {
    // ⚡ FIX: Send nested payload to match OpenAPI generated definition
    authActor.send({ 
        type: 'LOGIN', 
        payload: { email, password } 
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%)'
        }}
      >
        <Card 
          style={{ width: '100%', maxWidth: 400, border: `1px solid ${token.colorBorder}` }}
          bordered={false}
          hoverable
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ margin: 0, color: token.colorPrimary }}>
              Flodock
            </Title>
            <Text type="secondary">Secure Enterprise Access</Text>
          </div>

          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              closable 
              onClose={() => authActor.send({ type: 'CLEAR_ERROR' })}
              style={{ marginBottom: 24 }}
            />
          )}

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            <Input 
              size="large"
              placeholder="Operator ID (Email)" 
              prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAuthenticating || isAuthenticated}
              onPressEnter={handleSubmit}
            />

            <Input.Password 
              size="large"
              placeholder="Password" 
              prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthenticating || isAuthenticated}
              onPressEnter={handleSubmit}
            />
            
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={handleSubmit}
              loading={isAuthenticating}
              disabled={isAuthenticated}
              style={{ fontWeight: 'bold' }}
            >
              {isAuthenticating ? 'Authenticating...' : 'Access Platform'}
            </Button>

          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

// ⚡ LAZY LOAD COMPATIBILITY: Must use Default Export
export default LoginScreen;

