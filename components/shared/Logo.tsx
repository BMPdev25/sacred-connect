/**
 * Logo component that renders the Sacred Connect brand mark.
 * Supports 'icon-only' and 'full' layout variants at three size presets.
 * Display-only — no press interaction.
 */

import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';

// ---------------------------------------------------------------------------
// Size mapping constants
// ---------------------------------------------------------------------------

/** Maps a size token to the icon image dimension in dp. */
const ICON_SIZE: Record<LogoProps['size'], number> = {
  sm: 24,
  md: 40,
  lg: 80,
};

/** Maps a size token to the brand text fontSize. */
const TEXT_SIZE: Record<LogoProps['size'], number> = {
  sm: 10,
  md: 14,
  lg: 20,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for the Logo component. */
export interface LogoProps {
  /** Controls the rendered size of the logo icon and text. */
  size: 'sm' | 'md' | 'lg';
  /** 'icon-only' renders just the icon; 'full' renders icon + brand text. */
  variant: 'full' | 'icon-only';
}

// ---------------------------------------------------------------------------
// Sub-renderers (kept short to satisfy 40-line function rule)
// ---------------------------------------------------------------------------

/**
 * Renders the icon portion of the logo.
 */
function LogoIcon({ size }: { size: LogoProps['size'] }): React.ReactElement {
  const dimension = ICON_SIZE[size];
  return (
    <Image
      source={AssetService.getImage('shared.logoIcon') as ImageSourcePropType}
      style={{ width: dimension, height: dimension }}
      resizeMode="contain"
      accessibilityLabel="Sacred Connect logo icon"
    />
  );
}

/**
 * Renders the brand text portion (SACRED / CONNECT) beside the icon.
 */
function LogoText({ size }: { size: LogoProps['size'] }): React.ReactElement {
  const fontSize = TEXT_SIZE[size];
  return (
    <View style={styles.textContainer}>
      <Text style={[styles.brandText, { fontSize }]}>SACRED</Text>
      <Text style={[styles.brandText, { fontSize }]}>CONNECT</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Sacred Connect brand logo. Use this component anywhere the logo must appear.
 * Reads assets through AssetService so the source URL swaps automatically
 * when migrating to S3.
 */
export default function Logo({ size, variant }: LogoProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <LogoIcon size={size} />
      {variant === 'full' && <LogoText size={size} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  textContainer: {
    flexDirection: 'column',
  },
  brandText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: undefined,
  },
});
