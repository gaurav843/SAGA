/* FILEPATH: frontend/src/_kernel/config.ts */
/* @file Kernel Configuration (The Environment DNA) */
/* @author The Engineer */
/* @description Centralizes environment variables and abstracts the "Hardware Layer" (Vite Env).
 * ARCHITECTURE:
 * - ⚡ KERNEL LEVEL: Only this file interacts with 'import.meta.env'.
 * - ⚡ NORMALIZATION: Guarantees clean URL roots for the rest of the system.
 */

// 1. Detect API Base URL
// In Prod: Injected by CI/CD. In Dev: Defaults to Python backend port.
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 2. Normalize (The "Sanitizer")
// Removes trailing slashes AND accidental '/api/v1' suffixes to allow precise path joining.
export const API_BASE_URL = RAW_API_URL
    .replace(/\/api\/v1\/?$/, '') 
    .replace(/\/+$/, '');

// 3. Application Metadata
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.5.0';
export const IS_DEV = import.meta.env.DEV;
export const IS_DEBUG = import.meta.env.VITE_DEBUG_MODE === 'true';
