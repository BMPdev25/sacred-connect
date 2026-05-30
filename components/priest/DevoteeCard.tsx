import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';

interface DevoteeIdDetails {
  _id: string;
  name: string;
  profilePicture?: string;
  phone?: string;
}

interface DevoteeCardProps {
  /** The devotee detail data object. */
  devoteeId: DevoteeIdDetails;
  /** Booking status string to determine if call action is allowed. */
  status: string;
  /** Flag representing if this is the devotee's first ceremony booking. */
  isFirstTimeDevotee?: boolean;
}

/**
 * Triggers a native dialer call using Linking.
 *
 * @param phone - Raw phone number string.
 */
function handleCallDevotee(phone: string): void {
  try {
    const formattedPhone = phone.replace(/\D/g, '');
    Linking.openURL(`tel:+91${formattedPhone}`).catch((err) => {
      console.error('Failed to open dialer', err);
      Alert.alert('Calling unavailable', 'This device does not support telephone calls.');
    });
  } catch (err) {
    console.error('Failed to open dialer', err);
    Alert.alert('Error', 'Unable to initiate call.');
  }
}

function getProfilePictureUrl(pic: any): string | null {
  if (!pic) return null;
  if (typeof pic === 'string') return pic;
  if (typeof pic === 'object' && pic.url) return pic.url;
  return null;
}

/**
 * Renders the devotee card section with profile photo, name, badges, and call action.
 */
export default function DevoteeCard({ devoteeId, status, isFirstTimeDevotee }: DevoteeCardProps): React.JSX.Element {
  const showCallButton = devoteeId.phone && status === 'confirmed';
  const avatarUrl = getProfilePictureUrl(devoteeId.profilePicture);
  const avatarSource = avatarUrl
    ? { uri: avatarUrl }
    : AssetService.getImage('shared.avatarPlaceholder');

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>DEVOTEE</Text>
      
      <View style={styles.row}>
        <Image source={avatarSource} style={styles.avatar} />
        
        <View style={styles.content}>
          <Text style={styles.name}>{devoteeId.name}</Text>
          {isFirstTimeDevotee && (
            <View style={styles.firstPill}>
              <Text style={styles.firstPillText}>FIRST BOOKING</Text>
            </View>
          )}
        </View>

        {showCallButton && (
          <View style={styles.callWrapper}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCallDevotee(devoteeId.phone || '')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.callLabel}>Call</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  caption: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  firstPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  firstPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
  },
  callWrapper: {
    alignItems: 'center',
    marginLeft: 12,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callLabel: {
    fontSize: 11,
    color: THEME.colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
});
