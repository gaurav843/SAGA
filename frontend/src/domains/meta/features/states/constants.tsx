/* FILEPATH: frontend/src/domains/meta/features/states/constants.tsx */
/* @file Workflow Constants */
/* @author The Engineer */
/* @description Centralized definitions for Workflow Types, Icons, and Metadata.
 * INTEGRATED: UniversalNarrator for consistency tracking.
 */

import React from 'react';
import { 
    RocketOutlined, 
    SafetyCertificateOutlined, 
    SettingOutlined, 
    DeploymentUnitOutlined,
    PartitionOutlined
} from '@ant-design/icons';

export interface WorkflowTypeDef {
    value: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
}

export const WORKFLOW_TYPES: WorkflowTypeDef[] = [
    { 
        value: 'WIZARD', 
        label: 'Wizard Flow (UI Form Engine)', 
        icon: <RocketOutlined />, 
        color: 'purple',
        description: 'Multi-step forms with branching logic for users.'
    },
    { 
        value: 'GOVERNANCE', 
        label: 'Governance (State Lifecycle)', 
        icon: <SafetyCertificateOutlined />, 
        color: 'gold',
        description: 'Status transitions (Draft -> Active) with guard rules.'
    },
    { 
        value: 'JOB', 
        label: 'Background Job (Async Worker)', 
        icon: <SettingOutlined />, 
        color: 'cyan',
        description: 'Server-side tasks, queues, and retries.'
    },
    { 
        value: 'SUB_FLOW', 
        label: 'Sub-Process (Shared Logic)', 
        icon: <PartitionOutlined />, 
        color: 'blue',
        description: 'Reusable logic blocks called by other flows.'
    }
];

export const DEFAULT_WORKFLOW_ICON = <DeploymentUnitOutlined />;

export const getWorkflowMeta = (type: string) => {
    return WORKFLOW_TYPES.find(t => t.value === type) || {
        value: type,
        label: 'Unknown Flow',
        icon: DEFAULT_WORKFLOW_ICON,
        color: 'default',
        description: ''
    };
};
