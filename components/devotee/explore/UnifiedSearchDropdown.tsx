/**
 * UnifiedSearchDropdown -- two-section search results overlay.
 * Shows "Ceremonies" and "Pandits" sections with direct navigation.
 */

import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CeremonySearchResult, PriestSearchResult } from '@/types/explore.types';
import { getProfilePicSource } from '@/utils/imageUtils';
import { THEME } from '@/constants/theme';
import { SkeletonRow } from './SuggestionRow';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 3;
const ROW_HEIGHT = 56;
const AVATAR_SIZE = 32;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnifiedSearchDropdownProps {
  visible: boolean;
  query: string;
  ceremonies: CeremonySearchResult[];
  priests: PriestSearchResult[];
  isLoading: boolean;
  onCeremonyPress: (ceremonyId: string) => void;
  onPriestPress: (priestProfileId: string, userId: string) => void;
  onSearchAllPandits: (query: string) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Section header label. */
function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

/** Divider between rows. */
function Divider(): React.JSX.Element {
  return <View style={styles.divider} />;
}

/** Single ceremony result row. */
function CeremonyRow({
  item,
  onPress,
  showDivider,
}: {
  item: CeremonySearchResult;
  onPress: () => void;
  showDivider: boolean;
}): React.JSX.Element {
  const priceLabel = item.pricing?.basePrice
    ? `From ₹${item.pricing.basePrice.toLocaleString('en-IN')}`
    : null;

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Ceremony: ${item.name}`}
      >
        <View style={styles.ceremonyIconWrap}>
          <Ionicons name="sparkles-outline" size={18} color={THEME.colors.primary} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {item.category}
            {priceLabel ? `  ·  ${priceLabel}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={THEME.colors.textMuted} />
      </TouchableOpacity>
      {showDivider && <Divider />}
    </>
  );
}

/** Single pandit result row. */
function PriestRow({
  item,
  onPress,
  showDivider,
}: {
  item: PriestSearchResult;
  onPress: () => void;
  showDivider: boolean;
}): React.JSX.Element {
  const name = item.userId?.name ?? 'Pandit';
  const rating = item.ratings?.average;
  const topService =
    (item.services?.[0]?.ceremonyId as any)?.name ??
    null;

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Pandit: ${name}`}
      >
        <Image
          source={getProfilePicSource(item.userId?.profilePicture)}
          style={styles.avatar}
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {rating != null ? `★ ${rating.toFixed(1)}` : ''}
            {topService ? `  ·  ${topService}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={THEME.colors.textMuted} />
      </TouchableOpacity>
      {showDivider && <Divider />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Absolutely-positioned dropdown showing unified ceremony + pandit search results.
 * Renders null when not visible.
 */
export default function UnifiedSearchDropdown(
  props: UnifiedSearchDropdownProps
): React.JSX.Element | null {
  const {
    visible,
    query,
    ceremonies,
    priests,
    isLoading,
    onCeremonyPress,
    onPriestPress,
    onSearchAllPandits,
  } = props;

  if (!visible) return null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </View>
    );
  }

  const hasResults = ceremonies.length > 0 || priests.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasResults && (
          <Text style={styles.emptyText}>No results for &ldquo;{query}&rdquo;</Text>
        )}

        {ceremonies.length > 0 && (
          <>
            <SectionHeader title="Ceremonies" />
            {ceremonies.map((c, i) => (
              <CeremonyRow
                key={String(c._id)}
                item={c}
                onPress={() => onCeremonyPress(String(c._id))}
                showDivider={i < ceremonies.length - 1}
              />
            ))}
          </>
        )}

        {priests.length > 0 && (
          <>
            {ceremonies.length > 0 && <Divider />}
            <SectionHeader title="Pandits" />
            {priests.map((p, i) => (
              <PriestRow
                key={String(p._id)}
                item={p}
                onPress={() => {
                  const userId = (p.userId as any)?._id ?? String(p._id);
                  onPriestPress(String(p._id), String(userId));
                }}
                showDivider={i < priests.length - 1}
              />
            ))}
          </>
        )}

        {ceremonies.length > 0 && (
          <>
            <Divider />
            <TouchableOpacity
              style={styles.searchAllRow}
              onPress={() => onSearchAllPandits(query)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Ionicons name="search-outline" size={15} color={THEME.colors.primary} />
              <Text style={styles.searchAllText}>
                {'Search all pandits for '}
                <Text style={styles.searchAllQuery}>&ldquo;{query}&rdquo;</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    maxHeight: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    paddingBottom: 4,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  ceremonyIconWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: THEME.colors.border,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.md,
  },
  emptyText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
  },
  searchAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  searchAllText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  searchAllQuery: {
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});

