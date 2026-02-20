// FILEPATH: frontend/src/platform/logging/index.ts
// @file: Logging Barrel
// @role: ⚙️ Utility Export */
// @author: The Engineer
// @description: Exports the Singleton Logger for application-wide use.
// @security-level: LEVEL 0 (Kernel) */
// @invariant: Must always export a valid 'logger' instance. */

import { UniversalNarrator } from './Narrator';

/**
 * @description The Global Logger Instance.
 * Uses UniversalNarrator to support both console and remote telemetry (future).
 */
export const logger = new UniversalNarrator();

// Export Types if needed
export type { UniversalNarrator } from './Narrator';

