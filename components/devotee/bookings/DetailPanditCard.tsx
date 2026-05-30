import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { BookingStatus } from '@/types/bookingManagement.types';
import { DetailCard } from './DetailCard';

interface DetailPanditCardProps {
  status: BookingStatus;
  priestName: string;
  profilePicture?: string;
  avatarPlaceholder: any;
}

/**
 * DetailPanditCard displays priest contact and verification info.
 *
 * @param props.status - Current booking status.
 * @param props.priestName - Name of the priest.
 * @param props.profilePicture - Profile picture URL if any.
 * @param props.avatarPlaceholder - Default avatar asset.
 */
export function DetailPanditCard({
  status,
  priestName,
  profilePicture,
  avatarPlaceholder,
}: DetailPanditCardProps): React.JSX.Element {
  const profileSource = profilePicture ? { uri: profilePicture } : avatarPlaceholder;

  return (
    <DetailCard title="Your Pandit">
      <View style={styles.panditRow}>
        <Image source={profileSource} style={styles.panditAvatar} />
        <View style={styles.panditInfo}>
          <View style={styles.panditNameRow}>
            <Text style={styles.panditName} numberOfLines={1}>{priestName}</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {(status === 'confirmed' || status === 'completed') && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={14} color={THEME.colors.primary} />
              <Text style={styles.phoneText}>+91 9999999999</Text>
            </View>
          )}
          {status === 'confirmed' && (
            <Text style={styles.panditSubtext}>Pandit will call before the ceremony</Text>
          )}
        </View>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  panditRow: { flexDirection: 'row', alignItems: 'center' },
  panditAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' },
  panditInfo: { flex: 1, marginLeft: 12 },
  panditNameRow: { flexDirection: 'row', alignItems: 'center' },
  panditName: { fontSize: THEME.typography.subheading, fontWeight: '600', color: THEME.colors.textPrimary, flexShrink: 1 },
  verifiedPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  verifiedText: { fontSize: 10, color: THEME.colors.success, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  phoneText: { fontSize: THEME.typography.body, color: THEME.colors.textSecondary, marginLeft: 4 },
  panditSubtext: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textMuted, marginTop: 4 },
});
