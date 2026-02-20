/* FILEPATH: frontend/src/config.ts */
/* @file Application Configuration (The Environment Context) */
/* @author The Engineer */
/* @description Centralizes environment variables and base URLs.
 * FEATURES:
 * - ⚡ AUTO-DETECTION: Reads VITE_API_URL or defaults to localhost:8000.
 * - ⚡ NORMALIZATION: Strips trailing slashes AND '/api/v1' to prevent double-pathing.
 */

// 1. Detect API Base URL
// In Prod: Injected by CI/CD. In Dev: Defaults to Python backend port.
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 2. Normalize (Strip trailing slash and specific API suffix if present)
// This ensures we always get the HOST root (e.g. http://localhost:8000)
// even if the user set VITE_API_URL="http://localhost:8000/api/v1"
export const API_BASE_URL = RAW_API_URL
    .replace(/\/api\/v1\/?$/, '') // Remove /api/v1 if it was included in the env var
    .replace(/\/+$/, '');          // Remove any remaining trailing slashes

// 3. Application Metadata
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.5.0';
export const IS_DEV = import.meta.env.DEV;
export const IS_DEBUG = import.meta.env.VITE_DEBUG_MODE === 'true';

