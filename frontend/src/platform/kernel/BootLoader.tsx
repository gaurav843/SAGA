/* FILEPATH: frontend/src/platform/kernel/BootLoader.tsx */
/* @file Application Bootloader */
/* @author The Engineer */
/* @description Blocks rendering until the System Manifest is loaded.
 * MIGRATION: Swapped Material UI for Ant Design v5.
 */

import React from 'react';
import { Spin, Typography, Alert, Flex, theme } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useSystem } from './SystemContext';

export const BootLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, error } = useSystem();
  const { token } = theme.useToken();

  if (isLoading) {
    return (
      <Flex 
        vertical 
        align="center" 
        justify="center" 
        style={{ 
          height: '100vh', 
          backgroundColor: '#0a0a0a', 
          color: token.colorPrimary 
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 60, color: token.colorPrimary }} spin />} />
        
        <Typography.Title level={4} style={{ marginTop: 24, fontFamily: 'monospace', color: token.colorPrimary }}>
          INITIALIZING FLODOCK KERNEL...
        </Typography.Title>
        
        <Typography.Text type="secondary">
          Discovering Modules & Processes
        </Typography.Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex 
        align="center" 
        justify="center" 
        style={{ 
          height: '100vh', 
          backgroundColor: '#0a0a0a',
          padding: 24
        }}
      >
        <Alert
          message="SYSTEM HALTED"
          description={
            <>
              <Typography.Paragraph>{error}</Typography.Paragraph>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Please ensure the Backend API is running on Port 8000.
              </Typography.Text>
            </>
          }
          type="error"
          showIcon
          style={{ width: '100%', maxWidth: 500, border: `1px solid ${token.colorError}` }}
        />
      </Flex>
    );
  }

  return <>{children}</>;
};

