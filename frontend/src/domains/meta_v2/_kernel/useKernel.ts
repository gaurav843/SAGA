// FILEPATH: frontend/src/domains/meta_v2/_kernel/useKernel.ts
// @file: Kernel Hook Bridge (Resurrected)
// @role: 🔌 Adapter */
// @author: The Engineer
// @description: PREVENTS CRASHES. Re-exports the hook from KernelContext so existing imports work.
// @security-level: LEVEL 0 (Public) */

// ⚡ BRIDGE: This file exists solely to satisfy imports pointing to "../_kernel/useKernel"
// It redirects them to the actual implementation in KernelContext.tsx
export { useKernel } from './KernelContext';

