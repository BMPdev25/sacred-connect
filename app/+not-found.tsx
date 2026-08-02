import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { THEME } from '@/constants/theme';

/**
 * Fallback screen rendered when Expo Router fails to match the URL to any route.
 * Displays the unmatched pathname for easy debugging.
 */
export default function NotFoundScreen(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops! Page Not Found</Text>
      <Text style={styles.subtitle}>Unmatched Route: {pathname}</Text>
      <Link href="/splash" style={styles.link}>
        <Text style={styles.linkText}>Go back to Splash</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.background,
  },
  title: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: THEME.typography.body,
    color: THEME.colors.error,
    marginBottom: THEME.spacing.xl,
    textAlign: 'center',
  },
  link: {
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  linkText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
});
