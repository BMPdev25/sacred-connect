import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { Step6Documents } from '@/components/priest/onboarding/steps/Step6Documents';
import { THEME } from '@/constants/theme';
import { loadOnboardingProgress, submitForReview } from '@/services/priest/onboardingService';
import { StepRef } from '@/types/stepRef.types';

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

interface RejectionBannerProps {
  reason: string;
}

/**
 * Displays the admin's rejection reason at the top of the resubmit screen.
 */
function RejectionBanner({ reason }: RejectionBannerProps): React.ReactElement {
  return (
    <View style={styles.banner}>
      <Ionicons name="alert-circle-outline" size={20} color={THEME.colors.error} />
      <Text style={styles.bannerText}>
        {reason ? `Rejected: ${reason}` : 'Your documents could not be verified. Please re-upload and resubmit.'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/**
 * Screen allowing a rejected priest to re-upload verification documents and
 * resubmit their profile for admin review.
 *
 * Reached from the verification-status screen via the "Fix & Resubmit" button.
 * Accepts an optional `reason` search param containing the admin's rejection note.
 */
export default function ResubmitScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reason } = useLocalSearchParams<{ reason: string }>();
  const step6Ref = useRef<StepRef>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init(): Promise<void> {
      try {
        await loadOnboardingProgress();
      } catch (err: any) {
        console.error('ResubmitScreen: failed to load onboarding progress', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleSubmit(): Promise<void> {
    const isValid = step6Ref.current?.validate() ?? false;
    if (!isValid) return;

    setSubmitting(true);
    try {
      await submitForReview();
      router.replace('/priest/onboarding/verification-status' as any);
    } catch (err: any) {
      console.error('ResubmitScreen: submitForReview failed', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Fix & Resubmit</Text>
        <Text style={styles.subtitle}>
          Re-upload the required documents below, then tap Submit for Review.
        </Text>

        <RejectionBanner reason={reason || ''} />

        <Step6Documents ref={step6Ref} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, THEME.spacing.lg) }]}>
        <PrimaryButton
          title="Submit for Review"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
    backgroundColor: '#FEF2F2',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bannerText: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.error,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.background,
  },
});
