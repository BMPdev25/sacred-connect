/**
 * Theme configuration object containing color tokens, typography sizes,
 * spacing grid, border radius options, and reusable elevation shadows.
 */
export const THEME = {
  /**
   * Color palette for the application, conforming to brand identity.
   */
  colors: {
    primary: '#FF9933',
    primaryDark: '#E65C00',
    maroon: '#800000',
    gold: '#C9A84C',
    background: '#FAFAF7',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    success: '#22C55E',
    error: '#EF4444',
    border: '#E5E5E5',
    borderActive: '#FF9933',
    disabled: '#CCCCCC',
  },

  /**
   * Font sizes in pixels. Font weights should be defined at usage sites.
   */
  typography: {
    displayLarge: 32,
    displayMedium: 28,
    heading: 24,
    subheading: 18,
    body: 15,
    bodySmall: 13,
    caption: 11,
  },

  /**
   * Spacing values based on an 8pt grid.
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /**
   * Border radius tokens for consistency across UI components.
   */
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 100,
  },

  /**
   * Reusable shadow styles for card components.
   */
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
} as const;

/**
 * Converts a hex color string to rgba format with the specified opacity.
 * Useful for creating translucent overlay backgrounds.
 * 
 * @param hexColor - Hex color string (e.g. '#FF9933' or '#F93').
 * @param opacity - Opacity value between 0 and 1.
 * @returns Rgba color string.
 */
export function applyOpacity(hexColor: string, opacity: number): string {
  let hex = hexColor.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }
  
  if (hex.length !== 6) {
    return hexColor;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
