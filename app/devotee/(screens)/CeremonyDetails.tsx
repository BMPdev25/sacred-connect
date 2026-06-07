/**
 * CeremonyDetails — ceremony-first entry point screen.
 *
 * Displays ceremony hero, description, ritual steps, requirements,
 * and the list of pandits who perform it. Offers two booking paths:
 *  - "Book Instantly" → InstantBookingSetup (no priest chosen yet)
 *  - "Schedule with a Pandit" → ExploreTab filtered by this ceremony
 *
 * Navigation params: { ceremonyId: string }
 */

import React from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import { THEME } from '@/constants/theme';
import api from '@/api/index';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { setCeremonyContext, setBookingType, setPreferredPriest } from '@/redux/slices/bookingSlice';
import { AssetService } from '@/services/assets/AssetService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RitualStep {
  order: number;
  description: string;
}

interface CeremonyRequirements {
  materials?: string[];
  specialInstructions?: string;
}

interface CeremonyImage {
  url: string;
}

interface CeremonyPricing {
  basePrice: number;
}

interface PanditForCeremony {
  _id: string;
  name: string;
  profilePicture?: string;
  rating?: number;
  priceForThisCeremony?: number;
  experienceYears?: number;
  userId: { _id: string } | string;
}

interface CeremonyWithPriests {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  durationMinutes?: number;
  images?: CeremonyImage[];
  ritualSteps?: RitualStep[];
  requirements?: CeremonyRequirements;
  pricing: CeremonyPricing;
  priests?: PanditForCeremony[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Saffron-tinted section heading. */
function SectionHeading({ title }: { title: string }): React.JSX.Element {
  return <Text style={styles.sectionHeading}>{title}</Text>;
}

interface PanditCardProps {
  pandit: PanditForCeremony;
  onPress: () => void;
}

/** Horizontal pandit card for the ceremony pandits list. */
function PanditCard({ pandit, onPress }: PanditCardProps): React.JSX.Element {
  const avatarSource = pandit.profilePicture
    ? { uri: pandit.profilePicture }
    : AssetService.getImage('shared.avatarPlaceholder');

  return (
    <TouchableOpacity style={styles.panditCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={avatarSource as any} style={styles.panditAvatar} />
      <Text style={styles.panditName} numberOfLines={1}>{pandit.name}</Text>
      {pandit.rating != null && (
        <View style={styles.panditRatingRow}>
          <Ionicons name="star" size={12} color={THEME.colors.gold} />
          <Text style={styles.panditRating}>{pandit.rating.toFixed(1)}</Text>
        </View>
      )}
      {pandit.priceForThisCeremony != null && (
        <Text style={styles.panditPrice}>
          ₹{pandit.priceForThisCeremony.toLocaleString('en-IN')}
        </Text>
      )}
      {pandit.experienceYears != null && (
        <Text style={styles.panditExp}>{pandit.experienceYears} yrs exp</Text>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts the string user ID regardless of populated vs plain form. */
function getPriestUserId(userId: { _id: string } | string): string {
  if (typeof userId === 'string') return userId;
  return userId._id;
}

/** Formats duration minutes as a readable string. */
function formatDuration(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

/**
 * Renders the ceremony detail page with hero, info sections,
 * available pandits, and bottom booking CTAs.
 */
export default function CeremonyDetailsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { ceremonyId } = useLocalSearchParams<{ ceremonyId: string }>();

  const { data, isLoading, error } = useQuery<CeremonyWithPriests>({
    queryKey: ['ceremonyWithPriests', ceremonyId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: CeremonyWithPriests }>(
          `/ceremonies/${ceremonyId}/with-priests`
        )
        .then((r) => r.data.data),
    enabled: !!ceremonyId,
  });

  /** Instant booking: ceremony-first, no priest chosen yet. */
  const handleInstantBook = () => {
    if (!data) return;
    dispatch(setBookingType('instant'));
    dispatch(
      setCeremonyContext({
        ceremonyId: data._id,
        ceremonyName: data.name,
        basePrice: data.pricing.basePrice,
        durationMinutes: data.durationMinutes,
      })
    );
    dispatch(setPreferredPriest(null));
    router.push({
      pathname: '/devotee/(screens)/InstantBookingSetup' as any,
      params: { ceremonyId: data._id },
    });
  };

  /** Scheduled path: open ExploreTab filtered by this ceremony. */
  const handleSchedule = () => {
    router.push({
      pathname: '/devotee/(tabs)/ExploreTab' as any,
      params: { filterCeremonyId: ceremonyId },
    });
  };

  /** Navigate to pandit's full profile page. */
  const handlePanditPress = (pandit: PanditForCeremony) => {
    router.push({
      pathname: '/devotee/(screens)/PriestDetails' as any,
      params: {
        id: pandit._id,
        userId: getPriestUserId(pandit.userId),
        ceremonyId,
        ceremonyName: data?.name ?? '',
      },
    });
  };

  // ---- loading state ----
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="hourglass-outline" size={40} color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading ceremony…</Text>
      </View>
    );
  }

  // ---- error / not found ----
  if (error || !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.textMuted} />
        <Text style={styles.errorTitle}>Couldn't load ceremony</Text>
        <Text style={styles.errorSubtitle}>
          {(error as any)?.message ?? 'Please go back and try again.'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priests = data.priests ?? [];
  const heroImage = data.images?.[0]?.url;

  return (
    <View style={styles.container}>
      {/* Back button (absolutely positioned, per project rule) */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.surface} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 0, paddingBottom: 200 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SECTION 1: Hero ── */}
        <View style={styles.hero}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroGradient} />
          )}
          <View style={styles.heroDarkOverlay} />

          <View style={styles.heroContent}>
            {data.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{data.category}</Text>
              </View>
            ) : null}

            <Text style={styles.ceremonyName}>{data.name}</Text>

            <View style={styles.heroInfoRow}>
              {data.durationMinutes != null && (
                <>
                  <Ionicons name="time-outline" size={15} color={THEME.colors.surface} />
                  <Text style={styles.heroInfoText}>{formatDuration(data.durationMinutes)}</Text>
                </>
              )}
              {data.pricing?.basePrice != null && (
                <>
                  <Ionicons name="cash-outline" size={15} color={THEME.colors.surface} style={styles.heroInfoIcon} />
                  <Text style={styles.heroInfoText}>
                    From ₹{data.pricing.basePrice.toLocaleString('en-IN')}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* ── SECTION 2: About ── */}
          {data.description ? (
            <View style={styles.section}>
              <SectionHeading title="About this Ceremony" />
              <Text style={styles.bodyText}>{data.description}</Text>
            </View>
          ) : null}

          {/* ── SECTION 3: Ritual Steps ── */}
          {data.ritualSteps && data.ritualSteps.length > 0 ? (
            <View style={styles.section}>
              <SectionHeading title="Ritual Steps" />
              {data.ritualSteps.map((step, idx) => (
                <View key={idx} style={styles.ritualStepRow}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumber}>{step.order ?? idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.description}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── SECTION 4: Requirements ── */}
          {data.requirements && (
            <View style={styles.section}>
              <SectionHeading title="Requirements" />
              {data.requirements.materials && data.requirements.materials.length > 0 && (
                <View style={styles.materialsList}>
                  {data.requirements.materials.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
              {data.requirements.specialInstructions ? (
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={18} color={THEME.colors.primary} />
                  <Text style={styles.infoCardText}>{data.requirements.specialInstructions}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* ── SECTION 5: Available Pandits ── */}
          <View style={styles.section}>
            <SectionHeading title="Pandits Who Perform This" />
            {priests.length === 0 ? (
              <Text style={styles.noPanditsText}>
                No pandits currently available for this ceremony.
              </Text>
            ) : (
              <FlatList
                horizontal
                data={priests}
                keyExtractor={(p) => p._id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <PanditCard pandit={item} onPress={() => handlePanditPress(item)} />
                )}
                contentContainerStyle={styles.panditList}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Bar ── */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.ctaRow}>
          <View style={styles.ctaBlock}>
            <PrimaryButton
              title="⚡ Book Instantly"
              onPress={handleInstantBook}
            />
            <Text style={styles.ctaSubtitle}>Today, tomorrow or day-after</Text>
          </View>
        </View>
        <View style={styles.ctaRow}>
          <View style={styles.ctaBlock}>
            <PrimaryButton
              title="Schedule with a Pandit"
              variant="outline"
              onPress={handleSchedule}
            />
            <Text style={styles.ctaSubtitle}>Browse pandits and pick a time</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const HERO_HEIGHT = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  loadingText: {
    marginTop: THEME.spacing.sm,
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
  errorTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.md,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
  backLinkBtn: {
    marginTop: THEME.spacing.lg,
  },
  backLinkText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: THEME.borderRadius.pill,
    padding: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.primary,
  },
  heroDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ceremonyName: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.surface,
    marginBottom: 8,
  },
  heroInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  heroInfoText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.surface,
    marginRight: 12,
  },
  heroInfoIcon: {
    marginLeft: 8,
  },

  // Body
  body: {
    padding: THEME.spacing.md,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionHeading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.sm,
  },
  bodyText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
  },

  // Ritual steps
  ritualStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
    flexShrink: 0,
  },
  stepNumber: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.surface,
  },
  stepText: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
    paddingTop: 3,
  },

  // Requirements
  materialsList: {
    marginBottom: THEME.spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8EE',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#FFE4B5',
    gap: 10,
  },
  infoCardText: {
    flex: 1,
    fontSize: THEME.typography.bodySmall,
    color: '#8B5E00',
    lineHeight: 20,
  },

  // Pandits section
  noPanditsText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  panditList: {
    paddingRight: THEME.spacing.md,
  },
  panditCard: {
    width: 140,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginRight: THEME.spacing.sm,
    alignItems: 'center',
    ...THEME.shadow.card,
  },
  panditAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.border,
    marginBottom: THEME.spacing.sm,
  },
  panditName: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  panditRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  panditRating: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  panditPrice: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: 2,
  },
  panditExp: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },

  // Bottom bar
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    ...THEME.shadow.card,
    shadowOpacity: 0.15,
  },
  ctaRow: {
    marginBottom: THEME.spacing.sm,
  },
  ctaBlock: {
    width: '100%',
  },
  ctaSubtitle: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
