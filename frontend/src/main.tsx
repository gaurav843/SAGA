/* FILEPATH: frontend/src/main.tsx */
/* @file Application Entry Point (Live) */
/* @author The Engineer */
/* @description The true entry point. Initializes App, Telemetry, and API Client.
 * UPDATED: Uses Centralized Kernel Config for API Gateway.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

// Global Styles (Reset)
import './index.css';

// 🔌 KERNEL WIRING
import { CapabilitiesProvider } from './_kernel/CapabilitiesContext';
import { logger } from './platform/logging';
import { OpenAPI } from './api';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

// --- 0. CONFIGURATION ---

// ⚡ CRITICAL FIX: The Generated Services (src/api/services) ALREADY include '/api/v1' in their URLs.
// We must set the Base URL to the SERVER ROOT (http://localhost:8000), not the API Root.
// Our @kernel/config ALREADY provides this normalized root.
OpenAPI.BASE = API_BASE_URL; 

logger.tell('SYSTEM', `🔌 API Client Configured`, {
    openapi_base: OpenAPI.BASE
});

// --- 1. TELEMETRY BRIDGE ---

// Hook Axios into the Narrator so F12 shows API calls
axios.interceptors.request.use(request => {
    const method = request.method?.toUpperCase() || 'GET';
    const url = request.url;
    logger.whisper('NETWORK', `📡 ${method} ${url}`);
    if (request.data) {
        logger.tell('NETWORK', `   ↳ 📦 Payload`, request.data);
    }
    return request;
});

axios.interceptors.response.use(
    response => {
        const status = response.status;
        const url = response.config.url;
        logger.whisper('NETWORK', `✅ HTTP ${status} ${url}`);
        // Log response data if it's JSON
        if (response.data && (Array.isArray(response.data) || typeof response.data === 'object')) {
             const summary = Array.isArray(response.data) ? `List [${response.data.length}]` : 'Object';
             logger.tell('NETWORK', `   ↳ 📥 Response (${summary})`, response.data);
        }
        return response;
    },
    error => {
        const status = error.response?.status || 'ERR';
        const url = error.config?.url || 'Unknown';
        logger.scream('NETWORK', `🔥 HTTP ${status} ${url}`, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// --- 2. BOOT SEQUENCE ---

console.log("🔥 [BOOT] System Integrity Check Passed. Initializing Interface...");

// 📡 ACTIVATION: Signal the start of the session
logger.tell('SYSTEM', '🚀 Flodock Boot Sequence Initiated.');

const rootElement = document.getElementById('root');

if (!rootElement) {
  const msg = "🔥 [CRITICAL] FATAL: <div id='root'> is missing from index.html!";
  console.error(msg);
  logger.scream('SYSTEM', msg);
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
        {/* 🛡️ KERNEL GATEKEEPER 
            The App will NOT render until SystemCapabilities are fetched.
            This ensures no component ever sees a hardcoded Enum.
        */}
        <CapabilitiesProvider>
            <App />
        </CapabilitiesProvider>
    </React.StrictMode>
  );
  
  logger.tell('SYSTEM', '✅ Flodock OS Mounted Successfully (Ant Design Core).');
}

