/* FILEPATH: frontend/src/platform/shell/ThemePicker.tsx */
/* @file Theme Configuration Modal */
/* @author The Engineer */
/* @description A "System Preferences" style modal for visual customization.
 * FIX: Replaced deprecated 'destroyOnClose' with 'destroyOnHidden'.
 */

import React from 'react';
import { Modal, Row, Col, Card, Typography, theme, Button, Tooltip, Divider } from 'antd';
import { CheckOutlined, FormatPainterOutlined } from '@ant-design/icons';
import { useTheme } from './ThemeContext';
import { PRESET_COLORS, type ThemePreset } from './theme';

const { Text, Title } = Typography;

interface ThemePickerProps {
  open: boolean;
  onClose: () => void;
}

const PRESETS: { key: ThemePreset; label: string; description: string; color: string }[] = [
  { key: 'void', label: 'Void', description: 'Deep Space Dark', color: '#050505' },
  { key: 'polar', label: 'Polar', description: 'Clean & Crisp', color: '#ffffff' },
  { key: 'midnight', label: 'Midnight', description: 'Developer Focus', color: '#0f0c29' },
  { key: 'enterprise', label: 'Enterprise', description: 'SaaS Standard', color: '#f0f2f5' },
  { key: 'cyberpunk', label: 'Cyberpunk', description: 'High Contrast Neon', color: '#000000' },
];

export const ThemePicker: React.FC<ThemePickerProps> = ({ open, onClose }) => {
  const { preset, primaryColor, setPreset, setColor } = useTheme();
  const { token } = theme.useToken();

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FormatPainterOutlined />
            <span>Interface Appearance</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden={true} // ⚡ FIX: Updated from destroyOnClose
    >
      <div style={{ marginTop: 24 }}>
        
        {/* 1. PRESET SELECTOR */}
        <Title level={5} style={{ marginBottom: 16 }}>System Theme</Title>
        <Row gutter={[16, 16]}>
            {PRESETS.map((p) => {
                const isActive = preset === p.key;
                return (
                    <Col span={8} key={p.key}>
                        <Card 
                            hoverable
                            size="small"
                            onClick={() => setPreset(p.key)}
                            style={{ 
                                cursor: 'pointer',
                                borderColor: isActive ? token.colorPrimary : undefined,
                                borderWidth: isActive ? 2 : 1,
                                background: p.color,
                                transition: 'all 0.2s'
                            }}
                            styles={{ body: { padding: 12, textAlign: 'center' } }}
                        >
                            <div style={{ 
                                height: 8, 
                                width: '100%', 
                                background: isActive ? token.colorPrimary : '#888', 
                                opacity: 0.5,
                                marginBottom: 12,
                                borderRadius: 4
                            }} />
                            <Text strong style={{ 
                                color: ['void', 'midnight', 'cyberpunk'].includes(p.key) ? '#fff' : '#000' 
                            }}>
                                {p.label}
                            </Text>
                            <div style={{ fontSize: 10, opacity: 0.7, color: ['void', 'midnight', 'cyberpunk'].includes(p.key) ? '#fff' : '#000' }}>
                                {p.description}
                            </div>
                        </Card>
                    </Col>
                );
            })}
        </Row>

        <Divider />

        {/* 2. ACCENT COLOR SELECTOR */}
        <Title level={5} style={{ marginBottom: 16 }}>Accent Color</Title>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(PRESET_COLORS).map(([name, hex]) => {
                const isSelected = primaryColor === hex;
                return (
                    <Tooltip title={name.charAt(0).toUpperCase() + name.slice(1)} key={name}>
                        <div
                            onClick={() => setColor(hex)}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: hex,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: isSelected ? `2px solid ${token.colorText}` : '2px solid transparent',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'transform 0.2s'
                            }}
                        >
                            {isSelected && <CheckOutlined style={{ color: '#fff', fontWeight: 'bold' }} />}
                        </div>
                    </Tooltip>
                );
            })}
        </div>

        <Divider />
        
        <div style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};

