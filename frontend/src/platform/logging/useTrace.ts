/* FILEPATH: frontend/src/platform/logging/useTrace.ts */
/* @file Trace Hook */
/* @author The Engineer */
/* @description A React Hook that automatically reports component lifecycle to the Narrator.
 * USAGE: useTrace('ComponentName', { some: 'state' });
 */

import { useEffect, useRef } from 'react';
import { logger } from './Narrator';

export const useTrace = (componentName: string, state: Record<string, any> = {}) => {
  const isMounted = useRef(false);
  const prevState = useRef(JSON.stringify(state));

  useEffect(() => {
    // 1. Mount Log
    if (!isMounted.current) {
      logger.trace(componentName, 'Mounted', state);
      isMounted.current = true;
      return () => {
        // 2. Unmount Log
        logger.trace(componentName, 'Unmounted', {});
      };
    }
  }, []);

  useEffect(() => {
    // 3. Update Log (Only if state changed deeply)
    const currentStr = JSON.stringify(state);
    if (prevState.current !== currentStr) {
      logger.trace(componentName, 'Updated', state);
      prevState.current = currentStr;
    }
  }, [componentName, state]); // Dependencies trigger the effect
};

