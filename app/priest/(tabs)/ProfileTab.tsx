import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Share } from 'react-native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { AssetService } from '@/services/assets/AssetService';
import { CalendarService } from '@/services/priest/calendarService';
import { logout } from '@/services/auth/authService';
import { MenuSectionLabel } from '@/components/devotee/profile/MenuSectionLabel';
import { MenuCard } from '@/components/devotee/profile/MenuCard';
import { MenuRow } from '@/components/devotee/profile/MenuRow';
import { StarDisplay } from '@/components/shared/StarDisplay';

function getVerificationMessage(profile: any): { title: string; message: string } {
  const status = profile?.verificationStatus;
  const isVerified = profile?.isVerified === true;

  if (isVerified || status === 'approved' || status === 'verified') {
    return { title: 'Verified ✓', message: 'Your profile is verified and live on the platform.' };
  }
  if (status === 'pending') {
    return { title: 'Under Review', message: "Your documents are being reviewed. Usually 24–48 hours. We'll notify you." };
  }
  if (status === 'rejected') {
    const reason = profile.rejectionReason || 'No reason specified.';
    return { title: 'Verification Failed', message: `Your application was not approved. Reason: ${reason}\n\nContact support to resubmit.` };
  }
  return { title: 'Not Submitted', message: 'Complete onboarding to submit for verification.' };
}

function getProfilePictureUrl(pic: any): string | null {
  if (!pic) return null;
  if (typeof pic === 'string') return pic;
  if (typeof pic === 'object' && pic.url) return pic.url;
  return null;
}

/**
 * ProfileTab Component.
 * Renders the priest profile tab including verification status, ratings,
 * edit profile options, and log out functionality.
 */
export default function ProfileTab(): React.JSX.Element {
  const user = useSelector((state: RootState) => state.user);

  const { data: profile } = useQuery({
    queryKey: ['myPriestProfile'],
    queryFn: CalendarService.fetchPriestProfile,
    staleTime: 300000,
  });

  const handleVerificationStatus = () => {
    const { title, message } = getVerificationMessage(profile);
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Experience premium divine services! Download Sacred Connect: https://play.google.com/store/apps/details?id=com.bookmypujari',
        title: 'Share Sacred Connect',
      });
    } catch (err) {
      console.warn('Failed to share app', err);
    }
  };

  const handleLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        try { await logout(); } catch (err) { console.error('Sign-out error', err); }
      }},
    ]);
  };

  const avatarUrl = getProfilePictureUrl(profile?.profilePicture) || getProfilePictureUrl(user.profilePicture);
  const avatar = avatarUrl ? { uri: avatarUrl } : AssetService.getImage('shared.avatarPlaceholder');
  const rating = profile?.ratings?.average ?? 0;
  const reviewsCount = profile?.ratings?.count ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* IDENTITY SECTION */}
        <View style={styles.identitySection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/priest/(screens)/EditPriestProfile' as any)} activeOpacity={0.8}>
            <Image source={avatar} style={styles.avatar} />
            <View style={styles.cameraBadge}><Ionicons name="camera-outline" size={14} color="#FFFFFF" /></View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user.name || 'Sacred Pandit'}</Text>

          {/* Verification Badge */}
          <View style={styles.badgeRow}>
            {profile?.isVerified ? (
              <View style={styles.statusRow}><Ionicons name="shield-checkmark" size={16} color="#16A34A" /><Text style={[styles.statusText, styles.textVerified]}>Verified Pandit</Text></View>
            ) : profile?.verificationStatus === 'pending' ? (
              <View style={styles.statusRow}><Ionicons name="time-outline" size={16} color="#D97706" /><Text style={[styles.statusText, styles.textPending]}>Verification Pending</Text></View>
            ) : profile?.verificationStatus === 'rejected' ? (
              <View style={styles.statusRow}><Ionicons name="close-circle" size={16} color="#EF4444" /><Text style={[styles.statusText, styles.textRejected]}>Verification Failed</Text></View>
            ) : null}
          </View>

          {/* Ratings Section */}
          <View style={styles.ratingRow}>
            <StarDisplay rating={rating} size={14} />
            <Text style={styles.ratingText}> {rating.toFixed(1)} · {reviewsCount} reviews</Text>
          </View>
        </View>

        {/* MENU SECTIONS */}
        <MenuSectionLabel label="PROFILE" />
        <MenuCard>
          <MenuRow iconName="person-outline" label="Edit Profile" onPress={() => router.push('/priest/(screens)/EditPriestProfile' as any)} hasDivider />
          <MenuRow iconName="list-outline" label="Edit Services" onPress={() => router.push('/priest/(screens)/EditServices' as any)} hasDivider />
          <MenuRow iconName="calendar-outline" label="Edit Availability" onPress={() => router.push('/priest/(screens)/EditAvailability' as any)} hasDivider />
          <MenuRow iconName="shield-outline" label="Verification Status" onPress={handleVerificationStatus} />
        </MenuCard>

        <MenuSectionLabel label="SUPPORT" />
        <MenuCard>
          <MenuRow iconName="help-circle-outline" label="Help & Support" onPress={() => router.push('/devotee/(screens)/HelpSupport' as any)} hasDivider />
          <MenuRow iconName="share-social-outline" label="Share the App" onPress={handleShareApp} isExternal />
        </MenuCard>

        <MenuSectionLabel label="LEGAL" />
        <MenuCard>
          <MenuRow iconName="document-text-outline" label="Terms of Service" onPress={() => router.push({ pathname: '/devotee/(screens)/TermsPrivacy' as any, params: { type: 'terms' } })} hasDivider />
          <MenuRow iconName="shield-outline" label="Privacy Policy" onPress={() => router.push({ pathname: '/devotee/(screens)/TermsPrivacy' as any, params: { type: 'privacy' } })} />
        </MenuCard>

        <View style={styles.logoutContainer}>
          <MenuCard>
            <MenuRow iconName="log-out-outline" label="Log Out" onPress={handleLogOut} isDestructive />
          </MenuCard>
        </View>

        <Text style={styles.versionText}>Sacred Connect v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.colors.background },
  scrollContent: { paddingBottom: 32 },
  identitySection: { backgroundColor: THEME.colors.surface, paddingVertical: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  avatarContainer: { position: 'relative', width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 80, height: 80, borderRadius: THEME.borderRadius.pill, borderWidth: 2, borderColor: THEME.colors.primary },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: THEME.colors.surface },
  userName: { fontSize: THEME.typography.displayMedium, fontWeight: '700', color: THEME.colors.textPrimary, marginTop: 12, textAlign: 'center' },
  badgeRow: { marginTop: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: THEME.typography.body, fontWeight: '600', marginLeft: 6 },
  textVerified: { color: '#16A34A' },
  textPending: { color: '#D97706' },
  textRejected: { color: '#EF4444' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textSecondary },
  logoutContainer: { marginTop: 8 },
  versionText: { fontSize: THEME.typography.caption, color: THEME.colors.textMuted, textAlign: 'center', marginTop: 16, marginBottom: 32 },
});
