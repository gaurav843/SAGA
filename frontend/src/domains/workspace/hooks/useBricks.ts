// FILEPATH: frontend/src/domains/workspace/hooks/useBricks.ts
// @file: Bricks Data Hook
// @role: 📦 Data Access */
// @author: The Engineer
// @description: Fetches available System Capabilities (Bricks) for the App Studio.
// @security-level: LEVEL 9 (Read-Only) */
// @invariant: Must return a stable list of SystemBrick objects. */

import { useQuery } from '@tanstack/react-query';
import { WorkspaceService } from '../../../api/services/WorkspaceService';
import { logger } from '../../../platform/logging';

export const useBricks = () => {
    return useQuery({
        queryKey: ['workspace', 'bricks'],
        queryFn: async () => {
            logger.tell("STORE", "🧱 Fetching Brick Library...");
            try {
                // ⚡ FIX: Use the auto-generated verbose method name
                const result = await WorkspaceService.listBricksApiV1WorkspaceBricksGet();
                return result;
            } catch (error) {
                logger.scream("STORE", "🔥 Failed to fetch Bricks", error);
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes (Bricks don't change often)
        retry: 2
    });
};

