import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { clearUserSession } from '@/redux/slices/userSlice';
import { RootState } from '@/redux/store';
import { useVerificationPolling, VerificationStatus } from '@/hooks/useVerificationPolling';
import { isPriestVerified, normalizeVerificationStatus } from '@/utils/priestUtils';
import api from '@/api/index';

// ---------------------------------------------------------------------------
// Step indicator sub-component
// ---------------------------------------------------------------------------

interface StepItemProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}

function StepItem({ number, title, description, isLast = false }: StepItemProps) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeftCol}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepCircleText}>{number}</Text>
        </View>
        {!isLast && <View style={styles.stepDashedLine} />}
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function VerificationStatusScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const userEmail = useSelector((state: RootState) => state.user.email);

  const [loading, setLoading] = useState(true);
  const [priestProfile, setPriestProfile] = useState<{
    verificationStatus: 'pending' | 'verified' | 'rejected';
    isVerified?: boolean;
    rejectionReason?: string;
  } | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const response = await api.get('/priest/profile');
      const data = response.data;
      if (data?.verificationStatus) {
        data.verificationStatus = normalizeVerificationStatus(data.verificationStatus);
      }
      setPriestProfile(data);
    } catch (error) {
      console.error('Error fetching verification profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch the full profile (including rejectionReason) whenever the
  // polling hook detects a status transition while the screen is open.
  const handleStatusChange = useCallback((_status: VerificationStatus) => {
    loadStatus();
  }, [loadStatus]);

  useVerificationPolling(30000, handleStatusChange);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Auto-redirect approved priests
  useEffect(() => {
    if (isPriestVerified(priestProfile?.verificationStatus)) {
      router.replace('/priest' as any);
    }
  }, [priestProfile]);

  async function handleBackToLogin(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      // best-effort sign-out
    }
    dispatch(clearUserSession());
    router.replace('/(auth)/login' as any);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const isRejected = priestProfile?.verificationStatus === 'rejected';

  // -------------------------------------------------------------------------
  // REJECTED STATE
  // -------------------------------------------------------------------------

  if (isRejected) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle-outline" size={64} color="#EF4444" />
          </View>

          <View style={styles.statusContainer}>
            <Text style={[styles.statusHeading, { color: THEME.colors.textPrimary }]}>
              Verification Unsuccessful
            </Text>
            <Text style={styles.bodySecondary}>
              {priestProfile?.rejectionReason
                ? `Reason: ${priestProfile.rejectionReason}`
                : 'Your documents could not be verified.'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeading}>What to do next:</Text>
            <Text style={styles.bulletPoint}>• Review your uploaded documents</Text>
            <Text style={styles.bulletPoint}>• Ensure ID is clearly visible and not expired</Text>
            <Text style={styles.bulletPoint}>• Re-upload if needed from Edit Profile</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, THEME.spacing.lg) }]}>
          <PrimaryButton
            title="Fix & Resubmit"
            onPress={() =>
              router.push({
                pathname: '/priest/onboarding/resubmit',
                params: { reason: priestProfile?.rejectionReason || '' },
              } as any)
            }
            style={{ marginBottom: THEME.spacing.sm }}
          />
          <PrimaryButton
            variant="outline"
            title="Contact Support"
            onPress={() => Linking.openURL('mailto:support@sacredconnect.in')}
          />
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // PENDING STATE
  // -------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={44} color={THEME.colors.primary} />
          </View>
        </View>

        {/* Heading */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusHeading}>Profile Submitted! 🙏</Text>
          <Text style={styles.bodySecondary}>Your pandit profile is under review</Text>
        </View>

        {/* What happens next card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>What happens next?</Text>

          <StepItem
            number={1}
            title="Review"
            description="Our team reviews your profile and documents."
          />
          <StepItem
            number={2}
            title="Email notification"
            description={`You will receive an email at ${userEmail || 'your email'} once your profile is approved or if any changes are needed.`}
          />
          <StepItem
            number={3}
            title="Start earning"
            description="Once approved, log in to go online and start receiving bookings."
            isLast
          />
        </View>

        {/* Timeline card */}
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={20} color={THEME.colors.primary} />
          <Text style={styles.infoCardText}>Typical review time: 24–48 hours</Text>
        </View>

        {/* Contact card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardMuted}>Need help?</Text>
          <TouchableOpacity
            style={styles.mailRow}
            onPress={() => Linking.openURL('mailto:support@sacredconnect.in')}
          >
            <Ionicons name="mail-outline" size={16} color={THEME.colors.primary} />
            <Text style={styles.mailText}>support@sacredconnect.in</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: THEME.spacing.xl }} />
      </ScrollView>

      {/* Buttons footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, THEME.spacing.lg) }]}>
        <PrimaryButton
          title="Back to Login"
          onPress={handleBackToLogin}
          style={{ marginBottom: THEME.spacing.sm }}
        />
        <PrimaryButton
          variant="outline"
          title="Check Status Later"
          onPress={handleBackToLogin}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.xs,
  },
  statusHeading: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.maroon,
    textAlign: 'center',
  },
  bodySecondary: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadow.card,
  },
  cardHeading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  bulletPoint: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.sm,
  },
  stepLeftCol: {
    alignItems: 'center',
    width: 36,
    marginRight: THEME.spacing.md,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    color: THEME.colors.surface,
    fontWeight: '700',
    fontSize: THEME.typography.bodySmall,
  },
  stepDashedLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: 'transparent',
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 2,
  },
  stepBody: {
    flex: 1,
    paddingBottom: THEME.spacing.sm,
  },
  stepTitle: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    ...THEME.shadow.card,
  },
  infoCardText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  infoCardMuted: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  mailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  mailText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.background,
  },
});
