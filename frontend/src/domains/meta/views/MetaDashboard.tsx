// FILEPATH: frontend/src/domains/meta/views/MetaDashboard.tsx
// @file: Meta Studio Dashboard (v2.5)
// @author: The Engineer
// @description: The clean entry point for the new System Configurator.
//              UPDATED: Added 'App Studio' Card.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Row, Col, Statistic, theme, Button, Empty } from 'antd';
import { 
  RocketOutlined, 
  DatabaseOutlined, 
  SafetyCertificateOutlined, 
  NodeIndexOutlined,
  ArrowRightOutlined,
  SolutionOutlined,
  PartitionOutlined,
  LayoutOutlined // ⚡ NEW ICON
} from '@ant-design/icons';

const { Title, Text } = Typography;

const MetaDashboard: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ 
            display: 'inline-flex', 
            padding: 16, 
            background: 'rgba(0, 230, 118, 0.1)', 
            borderRadius: '50%', 
            marginBottom: 24 
          }}>
            <RocketOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
        </div>
        <Title level={2}>Flodock System Kernel</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Version 5.3 • Fractal Architecture Active
        </Text>
      </div>

      {/* MODULE GRID */}
      <Row gutter={[24, 24]}>
        
        {/* 1. DOMAIN REGISTRY */}
        <Col xs={24} sm={12} lg={6}>
            <Card 
                hoverable 
                style={{ height: '100%', borderTop: `4px solid ${token.colorInfo}` }}
                onClick={() => navigate('dictionary')}
            >
                <Statistic 
                    title="Domain Registry" 
                    value="Active" 
                    prefix={<DatabaseOutlined />} 
                    valueStyle={{ color: token.colorInfo }}
                />
                <div style={{ marginTop: 16 }}>
                    <Text type="secondary">Manage Data Schemas and Entity Definitions.</Text>
                </div>
                <Button 
                    type="link" 
                    icon={<ArrowRightOutlined />} 
                    style={{ paddingLeft: 0, marginTop: 16 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate('dictionary');
                    }}
                >
                    Open Dictionary
                </Button>
            </Card>
        </Col>

        {/* 2. GOVERNANCE ENGINE */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            style={{ height: '100%', borderTop: `4px solid ${token.colorSuccess}` }}
            onClick={() => navigate('governance')}
          >
            <Statistic 
                title="Governance Engine" 
                value="Active" 
                prefix={<SafetyCertificateOutlined />} 
                valueStyle={{ color: token.colorSuccess }}
            />
            <div style={{ marginTop: 16 }}>
                <Text type="secondary">Configure Access Control and Business Logic.</Text>
            </div>
            <Button 
                type="link" 
                icon={<ArrowRightOutlined />} 
                style={{ paddingLeft: 0, marginTop: 16 }}
                onClick={(e) => {
                    e.stopPropagation();
                    navigate('governance');
                }}
            >
                Manage Policies
            </Button>
          </Card>
        </Col>

        {/* 3. POLICY GROUPS */}
        <Col xs={24} sm={12} lg={6}>
           <Card 
             hoverable 
             style={{ height: '100%', borderTop: `4px solid ${token.colorPrimary}` }}
             onClick={() => navigate('groups')}
           >
               <Statistic 
                   title="Policy Groups" 
                   value="Ready" 
                   prefix={<SolutionOutlined />} 
                   valueStyle={{ color: token.colorPrimary }}
               />
               <div style={{ marginTop: 16 }}>
                   <Text type="secondary">Bundle logic rules into executable kits.</Text>
               </div>
               <Button 
                    type="link" 
                    icon={<ArrowRightOutlined />} 
                    style={{ paddingLeft: 0, marginTop: 16 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate('groups');
                    }}
                >
                    Manage Groups
                </Button>
           </Card>
        </Col>

        {/* 4. WORKFLOW ENGINE */}
        <Col xs={24} sm={12} lg={6}>
             <Card 
              hoverable 
              style={{ height: '100%', borderTop: `4px solid ${token.colorWarning}` }}
              onClick={() => navigate('states')}
            >
                <Statistic 
                    title="Workflow Engine" 
                    value="Beta" 
                    prefix={<PartitionOutlined />} 
                    valueStyle={{ color: token.colorWarning }}
                />
                <div style={{ marginTop: 16 }}>
                    <Text type="secondary">Design State Machines and Process Flows.</Text>
                </div>
                <Button 
                     type="link" 
                     icon={<ArrowRightOutlined />} 
                     style={{ paddingLeft: 0, marginTop: 16 }}
                     onClick={(e) => {
                         e.stopPropagation();
                         navigate('states');
                     }}
                 >
                     Open Designer
                 </Button>
            </Card>
        </Col>

        {/* 5. SWITCHBOARD */}
        <Col xs={24} sm={12} lg={6}>
           <Card 
             hoverable 
             style={{ height: '100%', borderTop: `4px solid #722ed1` }}
             onClick={() => navigate('switchboard')}
           >
               <Statistic 
                   title="Switchboard" 
                   value="Online" 
                   prefix={<NodeIndexOutlined />} 
                   valueStyle={{ color: '#722ed1' }}
               />
               <div style={{ marginTop: 16 }}>
                   <Text type="secondary">Connect Policies to Domains and Events.</Text>
               </div>
               <Button 
                    type="link" 
                    icon={<ArrowRightOutlined />} 
                    style={{ paddingLeft: 0, marginTop: 16 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate('switchboard');
                    }}
                >
                    Open Console
                </Button>
           </Card>
        </Col>

        {/* 6. APP STUDIO (⚡ NEW) */}
        <Col xs={24} sm={12} lg={6}>
           <Card 
             hoverable 
             style={{ height: '100%', borderTop: `4px solid #faad14` }}
             onClick={() => navigate('studio')}
           >
               <Statistic 
                   title="App Studio" 
                   value="New" 
                   prefix={<LayoutOutlined />} 
                   valueStyle={{ color: '#faad14' }}
               />
               <div style={{ marginTop: 16 }}>
                   <Text type="secondary">Visually build Screens and Menu Layouts.</Text>
               </div>
               <Button 
                    type="link" 
                    icon={<ArrowRightOutlined />} 
                    style={{ paddingLeft: 0, marginTop: 16 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate('studio');
                    }}
                >
                    Open Studio
                </Button>
           </Card>
        </Col>

      </Row>

      <div style={{ marginTop: 60, opacity: 0.5 }}>
         <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="Select a module to begin configuration." 
         />
      </div>
    </div>
  );
};

export default MetaDashboard;

