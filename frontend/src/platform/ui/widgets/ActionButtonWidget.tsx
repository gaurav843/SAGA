// FILEPATH: frontend/src/platform/ui/widgets/ActionButtonWidget.tsx
// @file: Action Button Widget (The Trigger)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Intent Logging)
// @invariant: Click must emit intent telemetry.
// @narrator: Logs user interaction and target scope.

import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { logger } from '../../logging';
import { IconFactory } from '../icons/IconFactory';

export const ActionButtonWidget: React.FC<any> = (props) => {
    // 1. Destructure Backend Config
    // Properties defined in DB: "label", "danger", "action_type", "target_scope"
    const { fieldProps, label } = props;
    const { 
        label: btnLabel, 
        danger, 
        icon, 
        action_type, 
        target_scope 
    } = fieldProps || {};

    const [isLoading, setIsLoading] = useState(false);

    // 2. Handle Interaction
    const handleClick = async () => {
        setIsLoading(true);
        
        // ⚡ NARRATOR: Announce Intent
        logger.tell("USER", `⚡ Clicked Action: [${btnLabel || label}]`, {
            type: action_type,
            scope: target_scope
        });

        // ⚡ SIMULATION (Until WizardContext is fully wired)
        // In a real implementation, this would call 'wizard.spawn(target_scope)'
        setTimeout(() => {
            Modal.info({
                title: 'Action Triggered',
                content: `Intent: Launch ${action_type} -> ${target_scope}`,
            });
            setIsLoading(false);
        }, 600);
    };

    return (
        <div style={{ marginBottom: 24 }}>
            {/* Render a Label if provided by Form Layout, but usually Buttons stand alone */}
            {/* <div className="ant-col ant-form-item-label"><label>{label}</label></div> */}
            
            <Button 
                type={danger ? 'primary' : 'default'}
                danger={danger}
                onClick={handleClick}
                loading={isLoading}
                icon={icon ? <IconFactory icon={icon} /> : null}
                block // Full width for visibility in forms
            >
                {btnLabel || label || "Action"}
            </Button>
        </div>
    );
};

