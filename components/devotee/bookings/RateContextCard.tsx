import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { THEME } from '@/constants/theme';

interface RateContextCardProps {
  priestName: string;
  profilePicture?: string;
  avatarPlaceholder: any;
  ceremonyType: string;
  displayDate: string;
}

/**
 * RateContextCard shows the devotee the context of the booking they are rating.
 *
 * @param props.priestName - Name of the priest.
 * @param props.profilePicture - Profile image URI.
 * @param props.avatarPlaceholder - Default avatar image.
 * @param props.ceremonyType - Category of the ceremony.
 * @param props.displayDate - Formatted ceremony date.
 */
export function RateContextCard({
  priestName,
  profilePicture,
  avatarPlaceholder,
  ceremonyType,
  displayDate,
}: RateContextCardProps): React.JSX.Element {
  const profileSource = profilePicture ? { uri: profilePicture } : avatarPlaceholder;

  return (
    <View style={styles.contextCard}>
      <Image source={profileSource} style={styles.avatar} />
      <View style={styles.contextInfo}>
        <Text style={styles.priestName} numberOfLines={1}>{priestName}</Text>
        <Text style={styles.ceremonyName} numberOfLines={1}>{ceremonyType}</Text>
      </View>
      <Text style={styles.dateText}>{displayDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contextCard: {
    backgroundColor: THEME.colors.surface,
    ...THEME.shadow.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB' },
  contextInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  priestName: { fontSize: THEME.typography.subheading, fontWeight: '600', color: THEME.colors.textPrimary },
  ceremonyName: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: THEME.typography.caption, color: THEME.colors.textMuted },
});
