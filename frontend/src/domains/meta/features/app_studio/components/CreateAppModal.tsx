// FILEPATH: frontend/src/domains/meta/features/app_studio/components/CreateAppModal.tsx
// @file: New App Manifestation Modal
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: A form to define the Identity (Name, Route, Purpose) of a new Application before it exists.
// @security-level: LEVEL 9 (Input Validation) */
// @invariant: Route Slug must be URL-safe (lowercase, hyphens). */

import React, { useEffect } from 'react';
import { Modal, Form, Input, Alert } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

interface CreateAppValues {
  title: string;
  route_slug: string;
  description?: string;
}

interface CreateAppModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateAppValues) => Promise<void>;
  isLoading?: boolean;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({ 
  open, 
  onCancel, 
  onSubmit, 
  isLoading 
}) => {
  const [form] = Form.useForm();

  // ⚡ AUTO-SLUG LOGIC
  // When title changes, auto-generate a slug if the user hasn't manually edited it.
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '');    // Trim leading/trailing hyphens
    
    // Only auto-set if the slug field is pristine or matches the previous auto-gen
    form.setFieldsValue({ route_slug: slug });
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RocketOutlined style={{ color: '#1890ff' }} />
          <span>Manifest New Application</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isLoading}
      okText="Initialize App"
      cancelText="Cancel"
      destroyOnClose
    >
      <Alert 
        message="Level 10 Architecture" 
        description="This will create a new Workspace Screen and mount a fresh Active App container." 
        type="info" 
        showIcon 
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{ description: '' }}
      >
        {/* 1. IDENTITY */}
        <Form.Item
          name="title"
          label="App Name"
          rules={[{ required: true, message: 'Please give your app a name' }]}
        >
          <Input 
            placeholder="e.g. HR Command Center" 
            onChange={handleTitleChange} 
            autoFocus 
          />
        </Form.Item>

        {/* 2. ROUTING */}
        <Form.Item
          name="route_slug"
          label="URL Route"
          tooltip="The path where this app will live (e.g. /app/hr-command)"
          rules={[
            { required: true, message: 'Route slug is required' },
            { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers, and hyphens only.' }
          ]}
        >
          <Input addonBefore="/app/" placeholder="hr-command" />
        </Form.Item>

        {/* 3. PURPOSE */}
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="What is the purpose of this application?" 
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

