// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/HistoryDrawer.tsx
// @file: History Drawer (Stable) - V
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Displays version timeline with Expandable JSON views.
// UPDATED: Eradicated Axios. Utilizes MetaKernelService OpenAPI SDK exclusively.

// @security-level: LEVEL 9 (UI Safe) */

import React, { useEffect, useState } from 'react';
import { Drawer, Timeline, Typography, Tag, Button, Card, Space, theme, Skeleton, App } from 'antd';
import { ClockCircleOutlined, RollbackOutlined, CheckCircleOutlined, HistoryOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { MetaKernelService } from '@/api/services/MetaKernelService';
import { logger } from '@/platform/logging/Narrator';
import type { Policy } from '../../../../../meta/features/governance/types';

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
  const { modal, message } = App.useApp();
  
  const [history, setHistory] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  useEffect(() => {
    if (open && policyKey) {
        setIsLoading(true);
        logger.whisper("GOVERNANCE", `Fetching Audit Trail for policy: ${policyKey}`);
        
        // ⚡ GATEWAY: OpenAPI SDK replaces Axios
        MetaKernelService.getPolicyHistoryApiV1MetaPoliciesKeyHistoryGet(policyKey)
            .then(res => {
                setHistory(res as unknown as Policy[]); // Alignment with SDK schema
                logger.trace("GOVERNANCE", `Loaded ${res.length} history records`, { count: res.length });
            })
            .catch(err => {
                logger.scream("GOVERNANCE", `Failed to load policy history`, err);
                message.error("Failed to load audit trail");
            })
            .finally(() => setIsLoading(false));
    }
  }, [open, policyKey, message]);

  const toggleExpand = (id: number) => {
      setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRestore = (versionId: number, versionLabel: string) => {
      modal.confirm({
          title: `Restore ${versionLabel}?`,
          content: 'This will create a NEW version based on this snapshot and immediately set it as the Active Head.',
          okText: 'Restore & Publish',
          okType: 'primary',
          onOk: async () => {
              try {
                  logger.tell("GOVERNANCE", `Initiating restore sequence for ${versionLabel} (ID: ${versionId})`);
                  await MetaKernelService.restorePolicyVersionApiV1MetaPoliciesVersionIdRestorePost(versionId);
                  message.success(`Restored ${versionLabel}`);
                  onRestore(); // Triggers reload
                  onClose();
              } catch (err) {
                  message.error('Restore Failed');
                  logger.scream("GOVERNANCE", `Restore failed for ID: ${versionId}`, err);
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

