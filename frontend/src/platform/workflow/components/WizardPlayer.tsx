// FILEPATH: frontend/src/platform/workflow/components/WizardPlayer.tsx
// @file: Wizard Player UI (Hybrid Engine - Fixed)
// @author: ansav8@gmail.com
// @description: Smartly switches between Form-based (Input) and View-based (Grid) modes.
// @updated: Added Registry Gatekeeper to prevent premature layout calculation.
// Improved Telemetry for "Live Mode" decisions.


import React, { useMemo } from 'react';
import { 
    Card, Form, Button, theme, Skeleton, Alert, 
    Typography, Space, Tag, Descriptions 
} from 'antd';

import { useWizardLogic } from '../logic/useWizardLogic';
import { FieldFactory } from '../wizard-engine/FieldFactory';
import { logger } from '../../logging';
import { IconFactory } from '../../ui/icons/IconFactory'; 
import { useWidgetRegistry } from '../wizard-engine/hooks/useWidgetRegistry';

const { Text } = Typography;

interface WizardPlayerProps {
    domain: string;
    scope: string;
    entityId?: string | number;
    onClose?: () => void;
}

export const WizardPlayer: React.FC<WizardPlayerProps> = ({ domain, scope, entityId, onClose }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    
    // ⚡ REGISTRY ACCESS
    const { getWidget, isLoading: isRegistryLoading } = useWidgetRegistry();

    const { 
        isLoading: isLogicLoading, 
        error, 
        currentStep, 
        stepDefinition, 
        formData, 
        isSubmitting, 
        isFirstStep, 
        isLiveMode, 
        isEditMode, 
        goNext, 
        goBack 
    } = useWizardLogic(domain, scope, entityId, onClose);

    const meta = stepDefinition?.meta || {};
    const formSchema = meta.form_schema || [];
    
    // ⚡ HYBRID DETECTION (MEMOIZED)
    // Only calculate this when the registry is ready to avoid false "Input" classification on fallbacks
    const isViewStep = useMemo(() => {
        if (isRegistryLoading) return false; // Default to form while loading to be safe

        // Categories that REQUIRE a Form Context (User Input)
        const inputCategories = ['INPUT', 'CHOICE', 'DATE', 'SECURITY', 'DOMAIN', 'ADVANCED'];
        
        const hasInput = formSchema.some((f: any) => {
            const def = getWidget(f.component);
            const isInput = inputCategories.includes(def.category);
            
            // Log decision for debugging
            if (isInput) {
                // logger.whisper("PLAYER", `Detected Input Widget: [${f.name}] (${def.key}) -> Category: ${def.category}`);
            }
            return isInput;
        });

        // If we have ANY inputs, it's NOT a view step. It's a Form step.
        return !hasInput;
    }, [formSchema, getWidget, isRegistryLoading]);

    React.useEffect(() => {
        if (stepDefinition && !isViewStep) {
            form.resetFields();
            form.setFieldsValue(formData);
        }
        
        if (stepDefinition && !isRegistryLoading) {
            logger.story("Wizard Player", `⚡ Entered Step: [${currentStep}]`, { 
                meta,
                mode: isViewStep ? "VIEW (Read-Only)" : "FORM (Interactive)",
                hybrid: !isViewStep && formSchema.some((f: any) => getWidget(f.component).category === 'DATA_DISPLAY')
            });
        }
    }, [currentStep, stepDefinition, isViewStep, formData, isLiveMode, isRegistryLoading]);

    const handleFinish = (values: any) => {
        logger.tell("USER", "✅ Submitting Step", values);
        goNext(values);
    };

    const handleViewNext = () => {
        logger.tell("USER", "➡️ Advancing View");
        goNext({}); 
    };

    const handleBack = () => {
        logger.tell("USER", "🔙 Clicked Back");
        goBack(); 
    };

    const renderFields = (context: any) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, rowGap: 0 }}>
            {formSchema.length > 0 ? (
                formSchema.map((field: any, idx: number) => (
                    <FieldFactory 
                        key={field.name || idx} 
                        field={field} 
                        context={context} 
                    />
                ))
            ) : (
                <div style={{ width: '100%', padding: 24, background: token.colorFillAlter, borderRadius: 8 }}>
                   <Descriptions title="Summary of Data" bordered column={1} size="small">
                       {Object.entries(formData).map(([key, val]) => (
                           <Descriptions.Item key={key} label={key}>
                               {String(val)}
                           </Descriptions.Item>
                       ))}
                   </Descriptions>
                   <div style={{ marginTop: 16, textAlign: 'center' }}>
                       <Text type="secondary">Please review before confirming.</Text>
                   </div>
                </div>
            )}
        </div>
    );

    const renderFooter = () => {
        // Detect if this is a "Submit" action
        const isSubmitStep = !stepDefinition?.on?.['NEXT'] && (stepDefinition?.on?.['SUBMIT'] || stepDefinition?.type === 'final');
        
        // ⚡ DYNAMIC LABEL LOGIC
        let buttonLabel = 'Next Step';
        if (isSubmitStep) {
            if (meta.submit_label) {
                buttonLabel = meta.submit_label; // Custom label from Seed
            } else {
                buttonLabel = isEditMode ? 'Update Record' : 'Create Record';
            }
        }

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: `1px solid ${token.colorSplit}` }}>
                <Button 
                    onClick={handleBack} 
                    disabled={isFirstStep || isSubmitting}
                    icon={<IconFactory icon="antd:ArrowLeftOutlined" />}
                    size="large"
                >
                    Back
                </Button>

                <Button 
                    type="primary" 
                    htmlType={isViewStep ? 'button' : 'submit'} 
                    onClick={isViewStep ? handleViewNext : undefined}
                    loading={isSubmitting}
                    danger={isLiveMode && isSubmitStep} 
                    icon={isSubmitStep ? <IconFactory icon="antd:CheckOutlined" /> : <IconFactory icon="antd:ArrowRightOutlined" />}
                    size="large"
                    style={{ minWidth: 140 }}
                >
                    {buttonLabel}
                </Button>
            </div>
        );
    };

    if (error) return <Alert message="Error" description={(error as Error).message} type="error" showIcon />;
    
    // ⚡ GATEKEEPER: Wait for BOTH logic and registry to be ready
    if (isLogicLoading || isRegistryLoading) {
        return (
            <Card style={{ margin: '0 auto', maxWidth: '100%', minHeight: 400 }} loading={true}>
                <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
        );
    }

    if (!stepDefinition) return <Alert message="Error" description="No Step Definition" type="error" />;

    return (
        <Card 
            title={
                <Space>
                    {isEditMode 
                        ? <IconFactory icon="antd:EditOutlined" style={{ color: token.colorWarning }} /> 
                        : <IconFactory icon="antd:RocketOutlined" style={{ color: token.colorPrimary }} />
                    }
                    <span>{meta.title || (isEditMode ? "Edit Record" : "New Record")}</span>
                </Space>
            }
            extra={
                <Space>
                    <Tag color="blue">{currentStep}</Tag>
                    {isLiveMode ? <Tag color="red">PRODUCTION</Tag> : <Tag color="cyan">SANDBOX</Tag>}
                </Space>
            }
            style={{ 
                maxWidth: '100%', 
                margin:'0 auto', 
                boxShadow: token.boxShadow,
                borderTop: isLiveMode ? `4px solid ${token.colorError}` : `4px solid ${token.colorSuccess}`
            }}
            styles={{ body: { padding: 32 } }}
        >
            <div style={{ marginBottom: 24 }}>
                {isLiveMode ? (
                    <Alert 
                        message="Live Mode" 
                        description="Changes are saved directly." 
                        type="warning" 
                        showIcon 
                    />
                ) : (
                    <Alert message="Sandbox" description="Simulation only." type="info" showIcon />
                )}
            </div>

            <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 16 }}>{meta.description}</Text>
            </div>

            {isViewStep ? (
                <>
                    {/* ⚡ PASS formData to View Context (View Mode: No Form Wrapper) */}
                    {renderFields({ domain, scope, isSubmitting, formData })} 
                    {/* Footer is rendered outside the form flow in view mode */}
                    {renderFooter()}
                </>
            ) : (
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={handleFinish}
                    initialValues={formData}
                    scrollToFirstError
                >
                    {/* ⚡ PASS formData to Form Context (Form Mode: Inside Form) */}
                    {renderFields({ domain, scope, isSubmitting, form, formData })}
                    {renderFooter()}
                </Form>
            )}
        </Card>
    );
};

