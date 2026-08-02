/**
 * LoadingSpinner component — used on every screen for loading states.
 * Renders a themed ActivityIndicator, optionally with a message and
 * optionally filling the full screen with a translucent white overlay.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { THEME } from '@/constants/theme';
import { applyOpacity } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Background colour used for the full-screen overlay. */
const OVERLAY_BG = applyOpacity(THEME.colors.surface, 0.9);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by LoadingSpinner. */
export interface LoadingSpinnerProps {
  /** Controls the size of the ActivityIndicator. Defaults to 'large'. */
  size?: 'small' | 'large';
  /**
   * When true, wraps the spinner in a flex:1 container with a semi-transparent
   * white overlay, centering it on screen. Defaults to false (inline).
   */
  fullScreen?: boolean;
  /** Optional message shown beneath the spinner in textSecondary colour. */
  message?: string;
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

/**
 * Renders the spinner and optional message, always themed with primary colour.
 */
function SpinnerCore({
  size,
  message,
}: {
  size: 'small' | 'large';
  message?: string;
}): React.ReactElement {
  return (
    <View style={styles.core}>
      <ActivityIndicator size={size} color={THEME.colors.primary} />
      {Boolean(message) && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Application loading indicator. Use `fullScreen` for page-level loading states
 * and the default inline mode for embedded loaders (e.g., inside buttons or lists).
 */
export default function LoadingSpinner({
  size = 'large',
  fullScreen = false,
  message,
}: LoadingSpinnerProps): React.ReactElement {
  if (fullScreen) {
    return (
      <View style={styles.overlay}>
        <SpinnerCore size={size} message={message} />
      </View>
    );
  }

  return <SpinnerCore size={size} message={message} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
  },
  message: {
    marginTop: THEME.spacing.sm,
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
});
