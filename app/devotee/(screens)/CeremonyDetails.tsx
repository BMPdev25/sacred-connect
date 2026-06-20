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
import { getCeremonyImageSource } from '@/utils/imageUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RitualStep {
  order: number;
  description: string;
}

interface CeremonyMaterial {
  name: string;
  quantity?: string;
  isOptional?: boolean;
  providedBy?: string;
}

interface CeremonyRequirements {
  materials?: CeremonyMaterial[];
  specialInstructions?: string;
  spaceRequirements?: string;
  participants?: string;
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

/**
 * Safely converts a requirements text field to a string.
 * Handles legacy DB documents where the field may be an array of strings.
 */
function toReqString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return (value as string[]).filter(Boolean).join(' ');
  return '';
}

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

  const { data, isLoading, error } = useQuery<{
    ceremony: CeremonyWithPriests;
    priests: PanditForCeremony[];
  }>({
    queryKey: ['ceremonyWithPriests', ceremonyId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: { ceremony: CeremonyWithPriests; priests: PanditForCeremony[] } }>(
          `/ceremonies/${ceremonyId}/with-priests`
        )
        .then((r) => r.data.data),
    enabled: !!ceremonyId,
  });

  /** Instant booking: ceremony-first, no priest chosen yet. */
  const handleInstantBook = () => {
    const ceremony = data?.ceremony;
    if (!ceremony?.pricing?.basePrice) {
      Alert.alert('Error', 'Ceremony details are still loading. Please try again.');
      return;
    }
    dispatch(setBookingType('instant'));
    dispatch(
      setCeremonyContext({
        ceremonyId: ceremony._id,
        ceremonyName: ceremony.name,
        basePrice: ceremony.pricing.basePrice,
        durationMinutes: (ceremony as any).duration?.typical ?? ceremony.durationMinutes,
      })
    );
    dispatch(setPreferredPriest(null));
    router.push({
      pathname: '/devotee/InstantBookingSetup' as any,
      params: { ceremonyId: ceremony._id },
    });
  };

  /** Scheduled path: open ExploreTab filtered by this ceremony. */
  const handleSchedule = () => {
    router.push({
      pathname: '/devotee/ExploreTab' as any,
      params: { filterCeremonyId: ceremonyId },
    });
  };

  /** Navigate to pandit's full profile page. */
  const handlePanditPress = (pandit: PanditForCeremony) => {
    router.push({
      pathname: '/devotee/PriestDetails' as any,
      params: {
        id: pandit._id,
        userId: getPriestUserId(pandit.userId),
        ceremonyId,
        ceremonyName: data?.ceremony?.name ?? '',
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
  if (error || !data?.ceremony) {
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

  const ceremony = data.ceremony;
  const priests = data.priests ?? [];
  const heroImageSource = getCeremonyImageSource(ceremony.images);


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
          <Image source={heroImageSource} style={styles.heroImage} />
          <View style={styles.heroDarkOverlay} />

          <View style={styles.heroContent}>
            {ceremony.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{ceremony.category}</Text>
              </View>
            ) : null}

            <Text style={styles.ceremonyName}>{ceremony.name}</Text>

            <View style={styles.heroInfoRow}>
              {((ceremony as any).duration?.typical ?? ceremony.durationMinutes) != null && (
                <>
                  <Ionicons name="time-outline" size={15} color={THEME.colors.surface} />
                  <Text style={styles.heroInfoText}>{formatDuration((ceremony as any).duration?.typical ?? ceremony.durationMinutes)}</Text>
                </>
              )}
              {ceremony.pricing?.basePrice != null && (
                <>
                  <Ionicons name="cash-outline" size={15} color={THEME.colors.surface} style={styles.heroInfoIcon} />
                  <Text style={styles.heroInfoText}>
                    From ₹{ceremony.pricing.basePrice.toLocaleString('en-IN')}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* ── SECTION 2: About ── */}
          {ceremony.description ? (
            <View style={styles.section}>
              <SectionHeading title="About this Ceremony" />
              <Text style={styles.bodyText}>{ceremony.description}</Text>
            </View>
          ) : null}

          {/* ── SECTION 3: Ritual Steps ── */}
          {ceremony.ritualSteps && ceremony.ritualSteps.length > 0 ? (
            <View style={styles.section}>
              <SectionHeading title="Ritual Steps" />
              {ceremony.ritualSteps.map((step, idx) => (
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
          {!!(ceremony as any).requirements && (
            <View style={styles.section}>
              <SectionHeading title="Requirements" />

              {/* Materials chips */}
              {((ceremony as any).requirements.materials ?? []).length > 0 && (
                <>
                  <Text style={styles.reqSubLabel}>What to Arrange</Text>
                  <View style={styles.chipsWrap}>
                    {((ceremony as any).requirements.materials as any[]).map((item: any, idx: number) => (
                      <View key={idx} style={styles.materialChip}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={THEME.colors.primary} />
                        <Text style={styles.materialChipText}>{typeof item === 'string' ? item : item.name}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Who should attend */}
              {typeof (ceremony as any).requirements.participants === 'string' &&
                !!(ceremony as any).requirements.participants && (
                <View style={[styles.reqInfoRow, { marginTop: THEME.spacing.md }]}>
                  <Ionicons name="people-outline" size={18} color={THEME.colors.primary} style={styles.reqRowIcon} />
                  <View style={styles.reqRowContent}>
                    <Text style={styles.reqRowLabel}>Who Should Attend</Text>
                    <Text style={styles.reqRowText}>{(ceremony as any).requirements.participants}</Text>
                  </View>
                </View>
              )}

              {/* Good to know / Special instructions */}
              {!!toReqString((ceremony as any).requirements.specialInstructions) && (
                <View style={[styles.reqInfoCard, { marginTop: THEME.spacing.md }]}>
                  <View style={styles.reqCardHeader}>
                    <Ionicons name="information-circle" size={18} color={THEME.colors.primary} />
                    <Text style={styles.reqRowLabel}>Good to Know</Text>
                  </View>
                  <Text style={[styles.reqRowText, { marginTop: 4 }]}>
                    {toReqString((ceremony as any).requirements.specialInstructions)}
                  </Text>
                </View>
              )}

              {/* Space needed */}
              {!!toReqString((ceremony as any).requirements.spaceRequirements) && (
                <View style={[styles.reqInfoRow, { marginTop: THEME.spacing.md }]}>
                  <Ionicons name="resize-outline" size={18} color={THEME.colors.primary} style={styles.reqRowIcon} />
                  <View style={styles.reqRowContent}>
                    <Text style={styles.reqRowLabel}>Space Needed</Text>
                    <Text style={styles.reqRowText}>
                      {toReqString((ceremony as any).requirements.spaceRequirements)}
                    </Text>
                  </View>
                </View>
              )}
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

  // Requirements — chip-based layout
  reqSubLabel: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8EE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  materialChipText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textPrimary,
  },
  reqInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  reqRowIcon: {
    marginTop: 2,
  },
  reqRowContent: {
    flex: 1,
  },
  reqRowLabel: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  reqRowText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
  reqInfoCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  reqCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
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
