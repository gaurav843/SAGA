/* FILEPATH: frontend/src/domains/meta/features/governance/components/editor/HistoryDrawer.tsx */
/* @file History Drawer (Stable) */
/* @author The Engineer */
/* @description Displays version timeline with Expandable JSON views.
 * FIX: Replaced static Modal.confirm with App.useApp().modal.confirm to fix silent crash.
 * UPDATED: Uses Centralized Kernel Config via Alias.
 */

import React, { useEffect, useState } from 'react';
import { Drawer, Timeline, Typography, Tag, Button, Card, Space, theme, Skeleton, App } from 'antd'; // ⚡ Added 'App'
import { 
    ClockCircleOutlined, RollbackOutlined, 
    CheckCircleOutlined, HistoryOutlined, 
    DownOutlined, UpOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

import type { Policy } from '../../types';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

const { Text, Paragraph } = Typography;

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  policyKey: string;
  currentVersionId?: number;
  onRestore: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  open, onClose, policyKey, currentVersionId, onRestore
}) => {
  const { token } = theme.useToken();
  const { modal, message } = App.useApp(); // ⚡ HOOK: Access System UI
  
  const [history, setHistory] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  useEffect(() => {
    if (open && policyKey) {
        setIsLoading(true);
        // ⚡ GATEWAY: Use standardized base
        axios.get(`${API_BASE_URL}/api/v1/meta/policies/${policyKey}/history`)
            .then(res => setHistory(res.data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }
  }, [open, policyKey]);

  const toggleExpand = (id: number) => {
      setExpandedIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleRestore = (versionId: number, versionLabel: string) => {
      // ⚡ FIX: Use the Hook-based Modal, not the Static one
      modal.confirm({
          title: `Restore ${versionLabel}?`,
          content: 'This will create a NEW version based on this snapshot and immediately set it as the Active Head.',
          okText: 'Restore & Publish',
          okType: 'primary',
          onOk: async () => {
              try {
                  await axios.post(`${API_BASE_URL}/api/v1/meta/policies/${versionId}/restore`);
                  message.success(`Restored ${versionLabel}`);
                  onRestore(); // Triggers reload
                  onClose();
              } catch (err) {
                  message.error('Restore Failed');
                  console.error(err);
              }
          }
      });
  };

  return (
    <Drawer
        title={
            <Space>
                <HistoryOutlined />
                <span>Audit Trail</span>
            </Space>
        }
        placement="right"
        width={600}
        onClose={onClose}
        open={open}
    >
        {isLoading ? <Skeleton active /> : (
            <Timeline mode="left" style={{ marginTop: 16 }}>
                {history.map((ver) => {
                    const isCurrent = ver.is_latest;
                    const isSelected = ver.id === currentVersionId;
                    const isActive = ver.is_active;
                    const isExpanded = expandedIds.includes(ver.id);
                    const versionLabel = `v${ver.version_major}.${(ver.version_minor).toString().padStart(2, '0')}`;
                    
                    return (
                        <Timeline.Item 
                            key={ver.id} 
                            color={isCurrent ? 'green' : 'gray'}
                            dot={isCurrent ? <CheckCircleOutlined style={{ fontSize: 16 }} /> : <ClockCircleOutlined />}
                        >
                            <Card 
                                size="small" 
                                style={{ 
                                    borderColor: isSelected ? token.colorPrimary : token.colorBorderSecondary,
                                    background: isSelected ? token.colorPrimaryBg : 'transparent',
                                    opacity: isActive ? 1 : 0.7
                                }}
                            >
                                {/* Header Row */}
                                <div 
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    onClick={() => toggleExpand(ver.id)}
                                >
                                    <Space size={8}>
                                        <Tag color={isActive ? 'green' : 'default'}>{versionLabel}</Tag>
                                        {!isActive && <Tag>Draft</Tag>}
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {dayjs(ver.created_at).format('YYYY-MM-DD HH:mm')}
                                        </Text>
                                    </Space>
                                    <Button 
                                        type="text" 
                                        size="small" 
                                        icon={isExpanded ? <UpOutlined /> : <DownOutlined />} 
                                    />
                                </div>

                                {/* Description */}
                                {ver.description && (
                                    <Paragraph ellipsis={{ rows: 1 }} style={{ fontSize: 12, margin: '4px 0', color: token.colorTextSecondary }}>
                                        {ver.description}
                                    </Paragraph>
                                )}

                                {/* RAW JSON VIEWER */}
                                {isExpanded && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ 
                                            background: token.colorFillAlter, 
                                            padding: 12, 
                                            borderRadius: 6, 
                                            border: `1px solid ${token.colorBorder}`,
                                            fontFamily: 'monospace',
                                            fontSize: 11,
                                            whiteSpace: 'pre-wrap',
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                            color: token.colorText
                                        }}>
                                            {JSON.stringify(ver.rules, null, 2)}
                                        </div>
                                        
                                        {!isCurrent && (
                                            <Button 
                                                block
                                                type="dashed" 
                                                icon={<RollbackOutlined />} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRestore(ver.id, versionLabel);
                                                }}
                                                style={{ marginTop: 8 }}
                                            >
                                                Restore this Configuration
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </Timeline.Item>
                    );
                })}
            </Timeline>
        )}
    </Drawer>
  );
};
