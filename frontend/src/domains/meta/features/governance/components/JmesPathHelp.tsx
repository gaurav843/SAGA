/* FILEPATH: frontend/src/domains/meta/features/governance/components/JmesPathHelp.tsx */
/* @file JMESPath Interactive Guide */
/* @author The Engineer */
/* @description On-screen documentation for Logic Governance.
 * UPDATED: Replaced hardcoded HEX values with Dynamic Theme Tokens for Dark Mode support.
 */

import React, { useState } from 'react';
import { 
    Drawer, Button, Tabs, Typography, Table, Tag, 
    Space, Card, Divider, Alert, Tooltip, theme 
} from 'antd';
import { 
    ReadOutlined, CodeOutlined, FunctionOutlined, 
    DatabaseOutlined, BulbOutlined, LinkOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph, Link } = Typography;

export const JmesPathHelp: React.FC = () => {
    const [open, setOpen] = useState(false);
    const { token } = theme.useToken(); // ⚡ DYNAMIC THEME INJECTION

    // --- CONTENT DATA ---

    const contextVars = [
        { key: 'host', desc: 'The Data Object', example: 'host.amount > 100' },
        { key: 'actor', desc: 'The User/Service', example: "actor.role == 'ADMIN'" },
        { key: 'system', desc: 'Environment', example: 'system.is_maintenance == false' },
        { key: 'meta', desc: 'Custom Attributes', example: "meta.risk_score > 80" },
        { key: 'session', desc: 'Session Data', example: "session.ip_address" },
    ];

    const operators = [
        { op: '==', desc: 'Equal To', ex: "status == 'ACTIVE'" },
        { op: '!=', desc: 'Not Equal', ex: "type != 'GUEST'" },
        { op: '>', desc: 'Greater Than', ex: "age > 18" },
        { op: '<', desc: 'Less Than', ex: "price < 50.00" },
        { op: '&&', desc: 'Logical AND', ex: "active && valid" },
        { op: '||', desc: 'Logical OR', ex: "admin || owner" },
        { op: '!', desc: 'Logical NOT', ex: "!deleted" },
    ];

    const functions = [
        { fn: 'length(@)', desc: 'Count items or characters', ex: "length(items) > 0" },
        { fn: 'contains(str, val)', desc: 'Check substring/item', ex: "contains(tags, 'URGENT')" },
        { fn: 'starts_with(str, pfx)', desc: 'String prefix', ex: "starts_with(name, 'Sys_')" },
        { fn: 'sort_by(@, key)', desc: 'Sort array', ex: "sort_by(logs, &timestamp)" },
        { fn: 'to_string(@)', desc: 'Convert to text', ex: "to_string(id) == '101'" },
    ];

    // --- RENDERERS ---

    const renderCode = (code: string) => (
        <Text code style={{ 
            color: token.colorError, // Typically Red/Pink in AntD, good for code highlighting
            background: token.colorFillAlter, // Subtle background that adapts to Dark Mode
            borderColor: token.colorBorder,
            fontFamily: 'monospace'
        }}>
            {code}
        </Text>
    );

    return (
        <>
            <Tooltip title="Open Logic Guide">
                <Button 
                    icon={<ReadOutlined />} 
                    onClick={() => setOpen(true)}
                    type="text"
                >
                    Syntax Guide
                </Button>
            </Tooltip>

            <Drawer
                title={
                    <Space>
                        <CodeOutlined style={{ color: token.colorPrimary }} />
                        <span>Governance Logic Guide</span>
                    </Space>
                }
                width={600}
                onClose={() => setOpen(false)}
                open={open}
                styles={{ 
                    body: { padding: 0 },
                    header: { borderBottom: `1px solid ${token.colorSplit}` } 
                }}
            >
                <Tabs 
                    defaultActiveKey="1" 
                    tabPosition="top"
                    style={{ height: '100%' }}
                    items={[
                        {
                            key: '1',
                            label: <Space><DatabaseOutlined /> Context</Space>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Title level={4}>Flodock Context Envelope</Title>
                                    <Paragraph>
                                        Your logic executes inside a "Sandbox". 
                                        You must access data through these root namespaces.
                                    </Paragraph>
                                    
                                    <Table 
                                        dataSource={contextVars} 
                                        rowKey="key"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            { 
                                                title: 'Root Key', 
                                                dataIndex: 'key', 
                                                render: (k: string) => <Tag color="blue">{k}</Tag> 
                                            },
                                            { title: 'Description', dataIndex: 'desc' },
                                            { 
                                                title: 'Example', 
                                                dataIndex: 'example', 
                                                render: (e: string) => renderCode(e) 
                                            },
                                        ]}
                                    />

                                    <Divider />
                                    <Alert 
                                        message="Deep Access" 
                                        type="info" 
                                        showIcon 
                                        description={
                                            <span>
                                                Use dot notation to drill down: {renderCode('host.order.items[0].price')}. 
                                                If a path doesn't exist, it returns <code>null</code> (Safe Fail).
                                            </span>
                                        } 
                                    />
                                </div>
                            )
                        },
                        {
                            key: '2',
                            label: <Space><CodeOutlined /> Syntax</Space>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Title level={4}>Filters & Logic</Title>
                                    <Paragraph>
                                        Use JMESPath filters <code>[? ... ]</code> to extract matching data from lists.
                                    </Paragraph>

                                    <Card size="small" title="Operators" style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8 }}>
                                            {operators.map(o => (
                                                <React.Fragment key={o.op}>
                                                    <Tag color="magenta" style={{ textAlign: 'center' }}>{o.op}</Tag>
                                                    <Text strong>{o.desc}</Text>
                                                    {renderCode(o.ex)}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </Card>

                                    <Title level={5}>Advanced Selectors</Title>
                                    <ul style={{ lineHeight: '2em' }}>
                                        <li><b>Pipe ({`|`})</b>: Pass result to next function. {renderCode("people | [0].name")}</li>
                                        <li><b>List Projection ({`[*]`})</b>: Extract field from all items. {renderCode("users[*].email")}</li>
                                        <li><b>Filter ({`[? ...]`})</b>: Select items. {renderCode("tasks[?priority > `50`]")}</li>
                                    </ul>
                                </div>
                            )
                        },
                        {
                            key: '3',
                            label: <Space><FunctionOutlined /> Functions</Space>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Title level={4}>Built-In Functions</Title>
                                    <Paragraph>
                                        Flodock supports the full JMESPath function library.
                                    </Paragraph>
                                    
                                    <Table 
                                        dataSource={functions} 
                                        rowKey="fn"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            { title: 'Function', dataIndex: 'fn', render: (f: string) => <Text strong>{f}</Text> },
                                            { title: 'Use Case', dataIndex: 'desc' },
                                            { title: 'Syntax', dataIndex: 'ex', render: (e: string) => renderCode(e) },
                                        ]}
                                    />
                                    
                                    <Divider />
                                    <Title level={5}>Type Handling</Title>
                                    <Paragraph>
                                        <ul>
                                            <li><b>Numbers:</b> Use backticks: {renderCode("price > `100`")}</li>
                                            <li><b>Strings:</b> Use single quotes: {renderCode("status == 'open'")}</li>
                                            <li><b>Booleans:</b> Use backticks: {renderCode("is_valid == `true`")}</li>
                                        </ul>
                                    </Paragraph>
                                </div>
                            )
                        },
                        {
                            key: '4',
                            label: <Space><BulbOutlined /> Recipes</Space>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Title level={4}>Common Patterns</Title>
                                    
                                    <Card type="inner" title="1. VIP User Check" size="small" style={{ marginBottom: 16 }}>
                                        <Text>Allow if user is Admin OR has VIP tag.</Text>
                                        <br />
                                        {renderCode("actor.role == 'ADMIN' || contains(actor.tags, 'VIP')")}
                                    </Card>

                                    <Card type="inner" title="2. High Value Transaction" size="small" style={{ marginBottom: 16 }}>
                                        <Text>Trigger if amount is over 10k.</Text>
                                        <br />
                                        {renderCode("host.amount >= `10000`")}
                                    </Card>

                                    <Card type="inner" title="3. Missing Required Field" size="small" style={{ marginBottom: 16 }}>
                                        <Text>Block if 'email' is null or empty.</Text>
                                        <br />
                                        {renderCode("host.email == `null` || length(host.email) == `0`")}
                                    </Card>

                                    <Divider />
                                    <Space>
                                        <LinkOutlined />
                                        <Link href="https://jmespath.org/tutorial.html" target="_blank">
                                            Official JMESPath Interactive Tutorial
                                        </Link>
                                    </Space>
                                </div>
                            )
                        }
                    ]}
                />
            </Drawer>
        </>
    );
};

