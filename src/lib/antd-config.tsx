// Ant Design Configuration Provider
// Import this in components that use Ant Design

import { ConfigProvider, theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    // Seed Token - Primary color palette
    colorPrimary: '#2563eb', // Blue to match your existing theme
    colorSuccess: '#16a34a',
    colorWarning: '#f59e0b',
    colorError: '#dc2626',
    colorInfo: '#3b82f6',

    // Font
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,

    // Border
    borderRadius: 8,

    // Spacing
    controlHeight: 40,

    // Background
    colorBgContainer: '#ffffff',
  },

  algorithm: theme.defaultAlgorithm,

  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Input: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Table: {
      borderRadius: 8,
    },
    Card: {
      borderRadius: 12,
    },
    Modal: {
      borderRadius: 12,
    },
  },
};

// Dark theme configuration
export const antdDarkTheme: ThemeConfig = {
  ...antdTheme,
  algorithm: theme.darkAlgorithm,
  token: {
    ...antdTheme.token,
    colorBgContainer: '#1f2937',
  },
};

// Export ConfigProvider wrapper component
export const AntdProvider = ({ children, isDark = false }: { children: React.ReactNode; isDark?: boolean }) => {
  return (
    <ConfigProvider theme={isDark ? antdDarkTheme : antdTheme}>
      {children}
    </ConfigProvider>
  );
};
