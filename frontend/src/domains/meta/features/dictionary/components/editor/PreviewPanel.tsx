/* FILEPATH: frontend/src/domains/meta/features/dictionary/components/editor/PreviewPanel.tsx */
/* @file Live Preview Panel */
/* @author The Engineer */
/* @description Renders the widget in real-time.
 * FIX: Added missing render logic for NUMBER, SLIDER, CURRENCY, PERCENTAGE widgets.
 */

import React from 'react';
import { 
    Card, Form, Input, InputNumber, Select, Switch, 
    DatePicker, TimePicker, Checkbox, Radio, Upload, Tag, theme, Slider
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';

import type { AttributeDraft } from '../../types';
import { WidgetType } from '../../types';

interface PreviewPanelProps {
    draft: AttributeDraft;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ draft }) => {
    const { token } = theme.useToken();
    const { label, widget_type, configuration, data_type, is_required } = draft;

    const renderWidget = () => {
        const props: any = {
            placeholder: configuration.placeholder,
            disabled: false, 
            style: { width: '100%' }
        };

        // --- TEXT WIDGETS ---
        if (widget_type === WidgetType.INPUT) return <Input {...props} />;
        if (widget_type === WidgetType.TEXTAREA) return <Input.TextArea rows={3} {...props} />;
        if (widget_type === WidgetType.EMAIL) return <Input type="email" prefix="@" {...props} />;
        if (widget_type === WidgetType.PHONE) return <Input prefix="📞" {...props} />;
        if (widget_type === WidgetType.COLOR) return <Input type="color" style={{ width: 64, padding: 0, border: 'none' }} {...props} />;
        if (widget_type === WidgetType.RICH_TEXT) return <Input.TextArea rows={4} placeholder="[Rich Text Editor Placeholder]" {...props} />;

        // --- NUMBER WIDGETS ---
        if (widget_type === WidgetType.NUMBER) return <InputNumber {...props} min={configuration.min} max={configuration.max} step={configuration.step} />;
        if (widget_type === WidgetType.CURRENCY) return <InputNumber {...props} prefix={configuration.currency_symbol || '$'} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />;
        if (widget_type === WidgetType.PERCENTAGE) return <InputNumber {...props} suffix="%" min={0} max={100} />;
        if (widget_type === WidgetType.SLIDER) return <Slider min={configuration.min || 0} max={configuration.max || 100} defaultValue={configuration.min || 0} />;

        // --- SELECTION WIDGETS ---
        if (widget_type === WidgetType.DROPDOWN) return <Select {...props} options={configuration.options} />;
        if (widget_type === WidgetType.TAGS) return <Select {...props} mode="tags" options={configuration.options} tokenSeparators={[',']} />;
        if (widget_type === WidgetType.RADIO_GROUP) return <Radio.Group options={configuration.options} />;
        if (widget_type === WidgetType.CHECKBOX_GROUP) return <Checkbox.Group options={configuration.options} />;
        if (widget_type === WidgetType.AUTOCOMPLETE) return <Select showSearch {...props} options={configuration.options} />;

        // --- DATE WIDGETS ---
        if (widget_type === WidgetType.DATE_PICKER) return <DatePicker {...props} style={{ width: '100%' }} />;
        if (widget_type === WidgetType.DATETIME_PICKER) return <DatePicker showTime {...props} style={{ width: '100%' }} />;
        if (widget_type === WidgetType.TIME_PICKER) return <TimePicker {...props} style={{ width: '100%' }} />;

        // --- BOOLEAN WIDGETS ---
        if (widget_type === WidgetType.SWITCH) return <Switch defaultChecked={configuration.default_value} />;
        if (widget_type === WidgetType.CHECKBOX) return <Checkbox defaultChecked={configuration.default_value}>{label}</Checkbox>;

        // --- FILE WIDGETS ---
        if (widget_type === WidgetType.FILE_UPLOAD) {
            return (
                <Upload.Dragger style={{ padding: 16, background: token.colorBgContainer }}>
                    <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: token.colorPrimary }} /></p>
                    <p className="ant-upload-text" style={{ color: token.colorText }}>Click or drag file</p>
                    <p className="ant-upload-hint" style={{ color: token.colorTextSecondary }}>
                        Max: {configuration.max_size_mb || 5}MB 
                        {configuration.allowed_extensions && ` (${configuration.allowed_extensions.join(', ')})`}
                    </p>
                </Upload.Dragger>
            );
        }

        // --- COMPLEX WIDGETS ---
        if (widget_type === WidgetType.JSON_EDITOR) return <Input.TextArea rows={6} style={{ fontFamily: 'monospace' }} placeholder="{ ... }" />;
        if (widget_type === WidgetType.REFERENCE_LOOKUP) return <Select showSearch placeholder={`Select ${configuration.target_domain || 'Record'}...`} style={{ width: '100%' }} disabled />;

        // Fallback
        return <Tag color="orange">Preview Not Available ({widget_type})</Tag>;
    };

    return (
        <Card 
            title={<span style={{ color: token.colorTextHeading }}><span style={{ marginRight: 8 }}>👁️</span> Live Preview</span>} 
            size="small" 
            style={{ 
                background: token.colorFillAlter, 
                borderColor: token.colorSplit,
                height: '100%'
            }}
            styles={{ body: { padding: 24 } }}
        >
            <Form layout="vertical">
                <Form.Item 
                    label={<span style={{ color: token.colorTextSecondary }}>{label || 'Field Label'}</span>}
                    required={is_required}
                    tooltip={draft.description}
                >
                    {renderWidget()}
                </Form.Item>
            </Form>

            <div style={{ 
                marginTop: 24, 
                fontSize: 10, 
                color: token.colorTextQuaternary, 
                textAlign: 'center', 
                borderTop: `1px dashed ${token.colorSplit}`, 
                paddingTop: 8 
            }}>
                Validation: {data_type} 
                {configuration.regex && ` | Regex: ${configuration.regex}`}
            </div>
        </Card>
    );
};

