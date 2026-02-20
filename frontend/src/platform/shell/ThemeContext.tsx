/* FILEPATH: frontend/src/platform/shell/ThemeContext.tsx */
/* @file Theme Context Controller (v2.0) */
/* @author The Engineer */
/* @description Manages Theme Presets and Primary Colors.
 * UPDATED: Supports 5 Presets and Custom Hex Colors.
 */

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { getThemeConfig, type ThemePreset, PRESET_COLORS } from './theme';

interface ThemeState {
  preset: ThemePreset;
  primaryColor: string;
}

interface ThemeContextType extends ThemeState {
  setPreset: (preset: ThemePreset) => void;
  setColor: (color: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State from LocalStorage
  const [preset, setPresetState] = useState<ThemePreset>(() => {
    return (localStorage.getItem('flodock_theme_preset') as ThemePreset) || 'void';
  });

  const [primaryColor, setColorState] = useState<string>(() => {
    return localStorage.getItem('flodock_theme_color') || PRESET_COLORS.primary;
  });

  // 2. Actions
  const setPreset = (newPreset: ThemePreset) => {
    setPresetState(newPreset);
    localStorage.setItem('flodock_theme_preset', newPreset);
    // Update HTML attribute for global CSS hooks (e.g. scrollbars)
    document.documentElement.setAttribute('data-theme', newPreset);
  };

  const setColor = (newColor: string) => {
    setColorState(newColor);
    localStorage.setItem('flodock_theme_color', newColor);
  };

  // 3. Compute Config
  const themeConfig = useMemo(() => getThemeConfig(preset, primaryColor), [preset, primaryColor]);
  
  // Helper: Is this a dark theme? (Void, Midnight, Cyberpunk are dark)
  const isDark = ['void', 'midnight', 'cyberpunk'].includes(preset);

  // 4. Effects
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preset);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [preset, isDark]);

  return (
    <ThemeContext.Provider value={{ preset, primaryColor, setPreset, setColor, isDark }}>
      <ConfigProvider theme={themeConfig}>
        <AntdApp style={{ height: '100%', fontFamily: 'inherit' }}>
            {children}
        </AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

