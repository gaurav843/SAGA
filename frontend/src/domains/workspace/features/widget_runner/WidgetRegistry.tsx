// FILEPATH: frontend/src/domains/workspace/features/widget_runner/WidgetRegistry.tsx
// @file: Widget Registry (Deep Gatekeeper Edition)
// @author: ansav8@gmail.com
// @description: Mounts the widget only after a LIVE, GRANULAR Governance Check.
// UPDATED: Now enforces 'circuit_state.ui' at the Scope level.

import React, { useEffect, useState } from 'react';
import { Result, Button, Spin } from 'antd';
import axios from 'axios';

import { WizardPlayer } from '../../../../platform/workflow/components/WizardPlayer';
import { logger } from '../../../../platform/logging';
import { API_BASE_URL } from '../../../../_kernel/config';
import type { ActiveApp } from '../../types';

export const WidgetRegistry: React.FC<{ app: ActiveApp, slug: string }> = ({ app, slug }) => {
    // Parse Scope (e.g. "USER:USER_ADMIN" -> domain="USER", scope="USER_ADMIN")
    const [domain, scope] = app.scope_key.includes(':') 
        ? app.scope_key.split(':') 
        : ['USER', app.scope_key];

    // ⚡ REAL-TIME GOVERNANCE STATE
    // We start in 'CHECKING' to prevent rendering the widget before we know it's safe.
    const [permission, setPermission] = useState<'CHECKING' | 'GRANTED' | 'DENIED'>('CHECKING');
    const [denialReason, setDenialReason] = useState<string>("");

    useEffect(() => {
        let isMounted = true;

        const verifyGovernance = async () => {
            setPermission('CHECKING');
            
            if (!domain) {
                if (isMounted) setPermission('DENIED');
                return;
            }

            try {
                // ⚡ DIRECT CHECK: Bypass the Manifest Cache
                // We ask the kernel specifically about the system domains right now.
                const res = await axios.get(`${API_BASE_URL}/api/v1/system/domains`);
                const domains = res.data;
                const targetDomain = domains.find((d: any) => d.key === domain.toUpperCase());
                
                if (!targetDomain) {
                    logger.warn('GOVERNANCE', `⚠️ Domain [${domain}] not found in Kernel. Defaulting to Deny.`);
                    if (isMounted) {
                        setDenialReason(`Domain '${domain}' is not registered in the Kernel.`);
                        setPermission('DENIED');
                    }
                    return;
                }

                // 1. Evaluate Domain Level Switches
                const isDomainUiEnabled = targetDomain.config?.ui_enabled !== false;
                const isDomainActive = targetDomain.is_active !== false;

                // 2. Evaluate Scope Level Switches (The Deep Check)
                let isScopeAllowed = true;
                let scopeStatus = "N/A";

                if (scope) {
                    const targetScope = targetDomain.scopes?.find((s: any) => s.key === scope.toUpperCase());
                    if (targetScope) {
                        // Check if specific UI circuit is HALTED
                        const uiState = targetScope.circuit_state?.ui;
                        scopeStatus = uiState || "NOMINAL"; // Default to NOMINAL if missing
                        
                        if (uiState === 'HALTED') {
                            isScopeAllowed = false;
                        }
                    } else {
                        // Scope defined in frontend but missing in backend registry?
                        // Fail Open for development, but log warning.
                        logger.warn('GOVERNANCE', `⚠️ Scope [${scope}] not found in Domain [${domain}]. Assuming Implicit Allow.`);
                    }
                }

                const isGranted = isDomainUiEnabled && isDomainActive && isScopeAllowed;

                logger.tell('GOVERNANCE', `🛡️ LIVE GATEKEEPER: [${domain}/${scope}]`, {
                    domain_active: isDomainActive,
                    domain_ui: isDomainUiEnabled,
                    scope_ui_circuit: scopeStatus,
                    final_verdict: isGranted ? 'GRANTED' : 'DENIED'
                });

                if (isMounted) {
                    if (isGranted) {
                        setPermission('GRANTED');
                    } else {
                        // Determine specific reason for user feedback
                        let reason = "System Policy Restriction.";
                        if (!isDomainActive) reason = `The entire '${domain}' module is currently HALTED.`;
                        else if (!isDomainUiEnabled) reason = `The '${domain}' interface is disabled.`;
                        else if (!isScopeAllowed) reason = `The '${scope}' feature is currently locked (Circuit: HALTED).`;
                        
                        setDenialReason(reason);
                        setPermission('DENIED');
                    }
                }

            } catch (err) {
                logger.scream('GOVERNANCE', '🔥 Check Failed', err);
                // Fail Safe: Security best practice is Fail Closed (Deny).
                if (isMounted) {
                    setDenialReason("Unable to verify security clearance. Connection to Kernel failed.");
                    setPermission('DENIED');
                }
            }
        };

        verifyGovernance();

        return () => { isMounted = false; };
    }, [domain, scope, app.scope_key]); // Re-run when switching widgets

    // ⚡ RENDER LOGIC

    if (permission === 'CHECKING') {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin tip={`Verifying Access to ${domain}/${scope}...`} />
            </div>
        );
    }

    if (permission === 'DENIED') {
        return (
            <div style={{ padding: 48, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Result
                    status="403"
                    title="Access Restricted"
                    subTitle={denialReason}
                    extra={<Button type="primary" onClick={() => window.history.back()}>Return to Safety</Button>}
                />
            </div>
        );
    }

    // ⚡ MOUNT WIDGET (Permission Granted)
    if (app.type === 'WIZARD' || app.type === 'VIEW') {
        return (
            <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
                {/* ⚡ CRITICAL: 'key' prop ensures fresh mount on switch, preventing state leakage */}
                <WizardPlayer 
                    key={app.scope_key} 
                    domain={domain} 
                    scope={scope} 
                />
            </div>
        );
    }

    return (
        <Result status="warning" title="Unknown Widget" subTitle={`Type: ${app.type}`} />
    );
};

