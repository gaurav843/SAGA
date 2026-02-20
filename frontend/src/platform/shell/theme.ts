/* FILEPATH: frontend/src/platform/shell/theme.ts */
/* @file Flodock Design System (v5.0) */
/* @author The Engineer */
/* @description Advanced Token Registry supporting Multi-Theme Presets.
 * FEATURES:
 * - 5 Distinct Presets (Void, Polar, Midnight, Enterprise, Cyberpunk).
 * - Dynamic Primary Color injection.
 * - Algorithm mixing (Dark/Light/Compact).
 */

import { theme, type ThemeConfig } from 'antd';

// --- TYPES ---
export type ThemePreset = 'void' | 'polar' | 'midnight' | 'enterprise' | 'cyberpunk';

export const PRESET_COLORS = {
  primary: '#00e676', // Hacker Green (Default)
  blue: '#1677ff',
  purple: '#722ed1',
  magenta: '#eb2f96',
  orange: '#fa8c16',
  cyan: '#13c2c2',
};

// --- PALETTE DEFINITIONS ---
const THEMES: Record<ThemePreset, any> = {
  // 1. VOID (Original Dark)
  void: {
    algorithm: theme.darkAlgorithm,
    token: {
      colorBgLayout: '#050505',
      colorBgContainer: '#141414',
      colorBgElevated: '#1f1f1f',
      colorBorder: '#303030',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },
    components: {
      Layout: { headerBg: '#141414', siderBg: '#141414' },
      Menu: { darkItemBg: '#141414' }
    }
  },

  // 2. POLAR (Original Light)
  polar: {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorBgLayout: '#f5f7fa',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBorder: '#e0e0e0',
      colorText: 'rgba(0, 0, 0, 0.88)',
    },
    components: {
      Layout: { headerBg: '#ffffff', siderBg: '#ffffff' },
      Menu: { itemBg: 'transparent' }
    }
  },

  // 3. MIDNIGHT (Deep Purple/Blue Focus)
  midnight: {
    algorithm: theme.darkAlgorithm,
    token: {
      colorBgLayout: '#0f0c29', // Deep gradient base
      colorBgContainer: '#181536', // Lighter purple-navy
      colorBgElevated: '#241b4d',
      colorBorder: '#2e2852',
      colorText: '#e0e0ff',
    },
    components: {
      Layout: { headerBg: '#181536', siderBg: '#181536' },
      Menu: { darkItemBg: '#181536' }
    }
  },

  // 4. ENTERPRISE (SaaS Standard)
  enterprise: {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorBgLayout: '#f0f2f5',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBorder: '#d9d9d9',
      colorText: '#1f1f1f',
    },
    components: {
      Layout: { headerBg: '#ffffff', siderBg: '#001529' }, // Navy Sidebar
      Menu: { darkItemBg: '#001529', itemColor: '#a6adb4', itemSelectedColor: '#fff', itemSelectedBg: '#1677ff' }
    }
  },

  // 5. CYBERPUNK (High Contrast Neon)
  cyberpunk: {
    algorithm: theme.darkAlgorithm,
    token: {
      colorBgLayout: '#000000',
      colorBgContainer: '#050505',
      colorBgElevated: '#111111',
      colorBorder: '#333333',
      colorText: '#00ff41', // Matrix Green Text
      fontFamily: `'Courier New', Courier, monospace`, // Terminal Font
      borderRadius: 0, // Sharp edges
    },
    components: {
      Layout: { headerBg: '#050505', siderBg: '#050505' },
      Card: { actionsLiMargin: '0' },
      Button: { borderRadius: 0, fontWeight: 800 }
    }
  }
};

export const getThemeConfig = (presetKey: ThemePreset, primaryColor: string): ThemeConfig => {
  const preset = THEMES[presetKey] || THEMES.void;
  
  return {
    algorithm: preset.algorithm,
    token: {
      colorPrimary: primaryColor,
      borderRadius: 6,
      wireframe: false,
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
      
      // Override with Preset Specifics
      ...preset.token,
    },
    components: {
      Layout: {
        bodyBg: preset.token.colorBgLayout,
        ...preset.components?.Layout
      },
      Menu: {
        ...preset.components?.Menu
      },
      Card: {
        colorBgContainer: preset.token.colorBgContainer,
        ...preset.components?.Card
      },
      Table: {
        headerBg: preset.token.colorBgElevated,
        ...preset.components?.Table
      },
      ...preset.components
    }
  };
};

