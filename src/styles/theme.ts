// src/styles/theme.ts

export const COLORS = {
  background: '#09090D',        // Deep dark grey/black
  surface: '#12121A',           // Cards and menu containers
  surfaceLight: '#1E1E2A',      // Highlighted items
  primary: '#8B5CF6',           // Vibrant Violet
  secondary: '#06B6D4',         // Bright Cyan
  accent: '#EC4899',            // Hot Pink (for highlights/badges)
  
  text: '#FFFFFF',              // Primary text
  textSecondary: '#94A3B8',     // Secondary slate text
  textMuted: '#64748B',         // Muted/disabled slate text
  
  border: '#2A2A3C',            // Thin borders
  error: '#EF4444',             // Alert/error red
  success: '#10B981',           // Success/downloaded emerald
  
  glass: 'rgba(255, 255, 255, 0.05)',
  glassDark: 'rgba(0, 0, 0, 0.6)',
  glowPrimary: 'rgba(139, 92, 246, 0.3)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const SHADOWS = {
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  glowSecondary: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};
