// FILEPATH: frontend/src/domains/meta/features/app_studio/components/IconFactory.tsx
// @file: Icon Factory Component
// @author: The Engineer
// @description: Renders icons from Token Strings. Supports 'antd:' prefix.

import React from 'react';
import * as AntdIcons from '@ant-design/icons';
import { Tooltip } from 'antd';

interface IconFactoryProps {
    icon: string; // e.g. "antd:UserOutlined"
    style?: React.CSSProperties;
    className?: string;
}

export const IconFactory: React.FC<IconFactoryProps> = ({ icon, style, className }) => {
    // 1. Handle Empty
    if (!icon) return <AntdIcons.QuestionCircleOutlined style={style} className={className} />;

    // 2. Parse Token
    const [provider, name] = icon.includes(':') ? icon.split(':') : ['antd', icon];

    // 3. Render Strategy: Ant Design
    if (provider === 'antd') {
        const IconComponent = (AntdIcons as any)[name];
        
        if (!IconComponent) {
            return (
                <Tooltip title={`Missing Icon: ${name}`}>
                    <AntdIcons.WarningOutlined style={{ ...style, color: 'orange' }} className={className} />
                </Tooltip>
            );
        }
        return <IconComponent style={style} className={className} />;
    }

    // Fallback
    return <AntdIcons.QuestionCircleOutlined style={style} className={className} />;
};

