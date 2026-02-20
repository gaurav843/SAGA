/* FILEPATH: frontend/src/platform/design/system/useNotification.ts */
/* @file Notification Hook (Ant Design Adapter) */
/* @author The Engineer */
/* @description A Developer-Experience (DX) focused hook for triggering toasts.
 * MIGRATION: Swapped custom Context for Ant Design's App.useApp().
 * USAGE: const { notify } = useNotification();
 */

import { App } from 'antd';
import type { NotificationOptions } from './NotificationContext';

export const useNotification = () => {
  // ⚡ HOOK INTO ANT DESIGN APP CONTEXT
  // This requires the component to be wrapped in <App> (which is done in App.tsx)
  const { notification, message } = App.useApp();

  // DX Wrapper: Provides semantic methods matching the old API
  const notify = {
    success: (content: string, duration = 3) => 
      message.success(content, duration),
      
    error: (content: string, duration = 4) => 
      message.error(content, duration),
      
    warning: (content: string, duration = 3) => 
      message.warning(content, duration),
      
    info: (content: string, duration = 3) => 
      message.info(content, duration),
    
    // Advanced usage with Title + Description
    open: (options: NotificationOptions) => {
        notification.open({
            message: options.message,
            description: options.description,
            duration: options.duration,
            key: options.key
        });
    }
  };

  return { notify };
};

