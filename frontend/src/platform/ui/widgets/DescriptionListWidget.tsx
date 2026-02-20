// FILEPATH: frontend/src/platform/ui/widgets/DescriptionListWidget.tsx
// @file: Description List Widget (Read-Only Display)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Pure Presentation)
// @invariant: Renders key-value pairs or static text strictly.
// @narrator: Logs visibility state.

import React from 'react';
import { Descriptions, Typography } from 'antd';
import { logger } from '../../logging';

const { Text } = Typography;

export const DescriptionListWidget: React.FC<any> = (props) => {
    // 1. Destructure Backend Config
    // fieldProps comes from the schema (e.g., { "value": "Set...", "column": 2 })
    const { fieldProps, label, value } = props;
    
    // 2. Resolve Content
    // Value can come from form data (value) or static config (fieldProps.value)
    const content = value || fieldProps?.value || '—';
    const column = fieldProps?.column || 1;

    React.useEffect(() => {
        logger.trace("UI", `📄 Rendering Description List [${props.name}]`);
    }, [props.name]);

    return (
        <Descriptions 
            title={fieldProps?.title} 
            bordered 
            size="small" 
            column={column}
            style={{ marginBottom: 24 }}
        >
            <Descriptions.Item label={label}>
                <Text>{content}</Text>
            </Descriptions.Item>
        </Descriptions>
    );
};

