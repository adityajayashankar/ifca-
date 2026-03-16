/**
 * Theme Utilities
 * 
 * Helper functions to apply theme colors and configuration
 */

import appConfig from '@/config/appConfig';

/**
 * Apply theme colors to CSS variables
 * Call this function in _app.js or a layout component to dynamically set theme colors
 */
export const applyThemeColors = () => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const colors = appConfig.theme.colors;

  // Apply primary colors
  Object.keys(colors.primary).forEach((key) => {
    root.style.setProperty(`--primary-${key}`, colors.primary[key]);
  });

  // Apply secondary colors
  Object.keys(colors.secondary).forEach((key) => {
    root.style.setProperty(`--secondary-${key}`, colors.secondary[key]);
  });

  // Apply accent colors
  Object.keys(colors.accent).forEach((key) => {
    root.style.setProperty(`--accent-${key}`, colors.accent[key]);
  });

  // Apply success colors
  Object.keys(colors.success).forEach((key) => {
    root.style.setProperty(`--success-${key}`, colors.success[key]);
  });

  // Apply warning colors
  Object.keys(colors.warning).forEach((key) => {
    root.style.setProperty(`--warning-${key}`, colors.warning[key]);
  });

  // Apply error colors
  Object.keys(colors.error).forEach((key) => {
    root.style.setProperty(`--error-${key}`, colors.error[key]);
  });

  // Apply additional colors
  if (colors.pink) {
    Object.keys(colors.pink).forEach((key) => {
      root.style.setProperty(`--pink-${key}`, colors.pink[key]);
    });
  }

  // Apply background colors
  if (colors.background) {
    Object.keys(colors.background).forEach((key) => {
      root.style.setProperty(`--background-${key}`, colors.background[key]);
    });
  }
};

/**
 * Get Material-UI theme colors object
 * Returns colors in format compatible with Material-UI theme
 */
export const getMuiThemeColors = () => {
  const colors = appConfig.theme.colors;
  return {
    primary: {
      main: colors.primary[500],
      light: colors.primary[400],
      dark: colors.primary[600],
      contrastText: '#fff',
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[400],
      dark: colors.secondary[600],
      contrastText: '#fff',
    },
    error: {
      main: colors.error[500],
      light: colors.error[400],
      dark: colors.error[600],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[400],
      dark: colors.warning[600],
    },
    success: {
      main: colors.success[500],
      light: colors.success[400],
      dark: colors.success[600],
    },
    info: {
      main: colors.primary[500],
      light: colors.primary[400],
      dark: colors.primary[600],
    },
  };
};

/**
 * Get Tailwind color configuration
 * Returns colors in format compatible with Tailwind config
 */
export const getTailwindColors = () => {
  const colors = appConfig.theme.colors;
  return {
    primary: {
      50: `var(--primary-50)`,
      100: `var(--primary-100)`,
      200: `var(--primary-200)`,
      300: `var(--primary-300)`,
      400: `var(--primary-400)`,
      500: `var(--primary-500)`,
      600: `var(--primary-600)`,
      700: `var(--primary-700)`,
      800: `var(--primary-800)`,
      900: `var(--primary-900)`,
    },
    secondary: {
      50: `var(--secondary-50)`,
      100: `var(--secondary-100)`,
      200: `var(--secondary-200)`,
      300: `var(--secondary-300)`,
      400: `var(--secondary-400)`,
      500: `var(--secondary-500)`,
      600: `var(--secondary-600)`,
      700: `var(--secondary-700)`,
      800: `var(--secondary-800)`,
      900: `var(--secondary-900)`,
    },
    accent: {
      50: `var(--accent-50)`,
      100: `var(--accent-100)`,
      200: `var(--accent-200)`,
      300: `var(--accent-300)`,
      400: `var(--accent-400)`,
      500: `var(--accent-500)`,
      600: `var(--accent-600)`,
      700: `var(--accent-700)`,
      800: `var(--accent-800)`,
      900: `var(--accent-900)`,
    },
    success: {
      50: `var(--success-50)`,
      100: `var(--success-100)`,
      200: `var(--success-200)`,
      300: `var(--success-300)`,
      400: `var(--success-400)`,
      500: `var(--success-500)`,
      600: `var(--success-600)`,
      700: `var(--success-700)`,
      800: `var(--success-800)`,
      900: `var(--success-900)`,
    },
    warning: {
      50: `var(--warning-50)`,
      100: `var(--warning-100)`,
      200: `var(--warning-200)`,
      300: `var(--warning-300)`,
      400: `var(--warning-400)`,
      500: `var(--warning-500)`,
      600: `var(--warning-600)`,
      700: `var(--warning-700)`,
      800: `var(--warning-800)`,
      900: `var(--warning-900)`,
    },
    error: {
      50: `var(--error-50)`,
      100: `var(--error-100)`,
      200: `var(--error-200)`,
      300: `var(--error-300)`,
      400: `var(--error-400)`,
      500: `var(--error-500)`,
      600: `var(--error-600)`,
      700: `var(--error-700)`,
      800: `var(--error-800)`,
      900: `var(--error-900)`,
    },
  };
};













