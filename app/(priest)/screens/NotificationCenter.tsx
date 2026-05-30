import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

// TODO: Replace with full notification list implementation
// Fetch from GET /api/priest/notifications

/**
 * NotificationCenter screen for priests.
 * Displays a list of notification updates, currently a placeholder empty state.
 */
export default function NotificationCenter(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
      </TouchableOpacity>

      {/* Header Container */}
      <View style={[styles.header, { height: insets.top + 56, paddingTop: insets.top }]}>
        <Text style={styles.headerHeading}>Notifications</Text>
      </View>

      {/* Empty state */}
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={56} color={THEME.colors.textMuted} />
        <Text style={styles.emptyHeading}>No notifications yet</Text>
        <Text style={styles.emptyBody}>
          Booking updates and alerts will appear here
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  headerHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
