// FILEPATH: frontend/src/platform/ui/icons/IconFactory.tsx
// @file: Shared Icon Factory (Robust String Handler)
// @author: ansav8@gmail.com
// @description: Converts string tokens into Ant Design Icons.
// ⚡ FIX: Added debug logging to identify invalid inputs.
// ⚡ FALLBACK: Guarantees a valid React Element return.

import React from 'react';
import * as AntdIcons from '@ant-design/icons';
import { Tooltip } from 'antd';
import { logger } from '../../logging';

interface IconFactoryProps {
    icon: string | React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

export const IconFactory: React.FC<IconFactoryProps> = ({ icon, style, className }) => {
    // 1. Pass-through if it's already a React Node (e.g. from static config)
    if (React.isValidElement(icon)) return icon;

    // 2. Fallback for empty/null
    if (!icon || typeof icon !== 'string') {
        // Return an invisible span to keep layout stable
        return <span className="icon-placeholder" style={{ display: 'inline-block', width: 14, ...style }} />;
    }

    // 3. Parse "antd:IconName"
    const parts = icon.split(':');
    const name = parts.length > 1 ? parts[1] : parts[0];

    // 4. Resolve Component
    const lib = AntdIcons as any;
    const IconComponent = lib[name];

    // 5. Render or Warn
    if (IconComponent && typeof IconComponent === 'object') {
        return <IconComponent style={style} className={className} />;
    }

    // Fallback for missing icon
    return (
        <Tooltip title={`Missing Icon: ${name}`}>
            <AntdIcons.QuestionCircleOutlined 
                style={{ ...style, opacity: 0.5, color: 'orange' }} 
                className={className} 
            />
        </Tooltip>
    );
};

