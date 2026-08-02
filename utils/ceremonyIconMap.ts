import { THEME } from '@/constants/theme';

/**
 * Configuration structure mapping a ceremony name to visual icons and color tokens.
 */
export interface CeremonyIconConfig {
  /** Ionicons icon vector glyph identifier. */
  iconName: string;
  /** Translucent colored background to wrap the icon container. */
  backgroundColor: string;
  /** Primary accent styling applied directly to the icon. */
  iconColor: string;
}

/**
 * Standardized mapping table associating core ceremony type titles to their design assets.
 */
export const CEREMONY_ICON_MAP: Record<string, CeremonyIconConfig> = {
  'Griha Pravesh': {
    iconName: 'home-outline',
    backgroundColor: '#DCFCE7',
    iconColor: '#16A34A',
  },
  'Satyanarayan Puja': {
    iconName: 'flame-outline',
    backgroundColor: '#DBEAFE',
    iconColor: '#2563EB',
  },
  'Havan / Homam': {
    iconName: 'bonfire-outline',
    backgroundColor: '#F3E8FF',
    iconColor: '#7C3AED',
  },
  'Ganesh Puja': {
    iconName: 'star-outline',
    backgroundColor: '#FEF3C7',
    iconColor: '#D97706',
  },
  'Lakshmi Puja': {
    iconName: 'flower-outline',
    backgroundColor: '#FCE7F3',
    iconColor: '#DB2777',
  },
  'Wedding Ceremonies': {
    iconName: 'heart-outline',
    backgroundColor: '#FEE2E2',
    iconColor: '#DC2626',
  },
  'Naming Ceremony': {
    iconName: 'person-add-outline',
    backgroundColor: '#ECFDF5',
    iconColor: '#059669',
  },
  'Last Rites': {
    iconName: 'moon-outline',
    backgroundColor: '#F1F5F9',
    iconColor: '#475569',
  },
};

/**
 * Resolves an icon styling configuration matching a given ceremony name.
 * Performs an exact lookup, then a partial keyword match fallback, and finally returns a default fallback.
 *
 * @param ceremonyName - The name or description of the ceremony.
 * @returns The resolved icon visual configuration.
 */
export function getCeremonyIcon(ceremonyName: string): CeremonyIconConfig {
  if (!ceremonyName) {
    return {
      iconName: 'book-outline',
      backgroundColor: '#FFF3E0',
      iconColor: THEME.colors.primary,
    };
  }

  // 1. First try exact match in CEREMONY_ICON_MAP
  if (CEREMONY_ICON_MAP[ceremonyName]) {
    return CEREMONY_ICON_MAP[ceremonyName];
  }

  // 2. Then try partial match (ceremony name includes key)
  const normalizedInput = ceremonyName.toLowerCase();
  const matchedKey = Object.keys(CEREMONY_ICON_MAP).find((key) =>
    normalizedInput.includes(key.toLowerCase())
  );

  if (matchedKey) {
    return CEREMONY_ICON_MAP[matchedKey];
  }

  // 3. Default fallback
  return {
    iconName: 'book-outline',
    backgroundColor: '#FFF3E0',
    iconColor: THEME.colors.primary,
  };
}
