// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/ComponentMap.tsx
// @file: Component Registry Map (Omniscient Edition)
// @author: ansav8@gmail.com
// @description: Maps Backend Keys to Frontend Implementations with Deep Observability.
// @security-level: LEVEL 9 (Proxy Wrapper)
// @updated: Registered 'DESCRIPTION_LIST' and 'ACTION_BUTTON'.

import React from 'react';
import {
    ProFormText,
    ProFormTextArea,
    ProFormDigit,
    ProFormMoney,
    ProFormSelect,
    ProFormRadio,
    ProFormCheckbox,
    ProFormSegmented,
    ProFormTreeSelect,
    ProFormCascader,
    ProFormDatePicker,
    ProFormDateRangePicker,
    ProFormDateTimePicker,
    ProFormSwitch,
    ProFormSlider,
    ProFormRate,
    ProFormColorPicker,
    ProFormUploadButton,
} from '@ant-design/pro-components';

import { Transfer } from 'antd';

import { SecurePasswordWidget } from '../../../ui/widgets/SecurePasswordWidget';
import { UserSelectorWidget } from '../../../ui/widgets/UserSelectorWidget';
// ⚡ NEW IMPORTS
import { DescriptionListWidget } from '../../../ui/widgets/DescriptionListWidget';
import { ActionButtonWidget } from '../../../ui/widgets/ActionButtonWidget';

import { logger } from '../../../logging'; // ⚡ LINK NARRATOR

// ⚡ OMNISCIENT WRAPPER (The Spy)
// This HOC sits between the engine and the UI component.
// It logs everything that passes through.
const withNarrator = (Component: React.ComponentType<any>, componentName: string) => {
    return (props: any) => {
        // 1. INBOUND LOGGING (Props)
        React.useEffect(() => {
            const { form, fieldProps, ...cleanProps } = props;
            logger.trace("RENDER", `⬇️ Mounting [${componentName}]`, { 
                id: props.name || props.id,
                value: props.value,
                rules: props.rules?.length,
                hasAsyncRule: props.rules?.some((r: any) => typeof r.validator === 'function')
            });
        }, [props.value, props.name]);

        // 2. OUTBOUND INTERCEPTION (Events)
        const interceptedProps = { ...props };

        if (props.onChange) {
            interceptedProps.onChange = (...args: any[]) => {
                // Extract value safely
                let val = args[0];
                if (val && val.target) val = val.target.value; // Event object
                
                logger.trace("EVENT", `⬆️ [${componentName}] Change`, { value: val });
                
                // Pass through to original handler
                return props.onChange(...args);
            };
        }

        if (props.onBlur) {
            interceptedProps.onBlur = (...args: any[]) => {
                logger.trace("EVENT", `⬆️ [${componentName}] Blur`);
                return props.onBlur(...args);
            };
        }

        return <Component {...interceptedProps} />;
    };
};

// Wrapper for Transfer
const TransferWrapper = (props: any) => <Transfer {...props} />;

// ⚡ THE MAPPING (Wrapped)
export const COMPONENT_MAP: Record<string, React.FC<any>> = {
    // GROUP 1: TEXT
    'TEXT_INPUT': withNarrator(ProFormText, 'TEXT_INPUT'),
    'TEXTAREA': withNarrator(ProFormTextArea, 'TEXTAREA'),
    'NUMBER_INPUT': withNarrator(ProFormDigit, 'NUMBER_INPUT'),
    'CURRENCY_INPUT': withNarrator(ProFormMoney, 'CURRENCY_INPUT'),

    // GROUP 2: CHOICE
    'SELECT_DROPDOWN': withNarrator(ProFormSelect, 'SELECT_DROPDOWN'),
    'RADIO_GROUP': withNarrator(ProFormRadio.Group, 'RADIO_GROUP'),
    'CHECKBOX_GROUP': withNarrator(ProFormCheckbox.Group, 'CHECKBOX_GROUP'),
    'SEGMENTED_CONTROL': withNarrator(ProFormSegmented, 'SEGMENTED_CONTROL'),
    'TREE_SELECT': withNarrator(ProFormTreeSelect, 'TREE_SELECT'),
    'CASCADER': withNarrator(ProFormCascader, 'CASCADER'),
    'TRANSFER': withNarrator(TransferWrapper, 'TRANSFER'),

    // GROUP 3: DATE
    'DATE_PICKER': withNarrator(ProFormDatePicker, 'DATE_PICKER'),
    'DATE_RANGE': withNarrator(ProFormDateRangePicker, 'DATE_RANGE'),
    'TIME_PICKER': withNarrator(ProFormDateTimePicker, 'TIME_PICKER'),

    // GROUP 4: VISUAL
    'BOOLEAN_SWITCH': withNarrator(ProFormSwitch, 'BOOLEAN_SWITCH'),
    'SLIDER_INPUT': withNarrator(ProFormSlider, 'SLIDER_INPUT'),
    'RATE_INPUT': withNarrator(ProFormRate, 'RATE_INPUT'),
    'COLOR_PICKER': withNarrator(ProFormColorPicker, 'COLOR_PICKER'),
    'FILE_UPLOAD': withNarrator(ProFormUploadButton, 'FILE_UPLOAD'),

    // GROUP 5: SECURITY
    'SECURE_PASSWORD': withNarrator(SecurePasswordWidget, 'SECURE_PASSWORD'),

    // GROUP 6: DOMAIN
    'USER_SELECTOR': withNarrator(UserSelectorWidget, 'USER_SELECTOR'),
    
    // ⚡ GROUP 7: DATA & ACTIONS (The Missing Pieces)
    'DESCRIPTION_LIST': withNarrator(DescriptionListWidget, 'DESCRIPTION_LIST'),
    'ACTION_BUTTON': withNarrator(ActionButtonWidget, 'ACTION_BUTTON')
};

