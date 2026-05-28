/**
 * FilterBottomSheet — slide-up panel for configuring priest search filters.
 *
 * Reads and writes all filter state directly to/from Redux exploreSlice.
 * Sub-components handle individual filter sections, keeping this file
 * under the 200-line limit.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '@/redux/store';
import {
  resetFilters,
  toggleCeremonyType,
  toggleLanguage,
  setMinRating,
  setPriceRange,
  setMaxDistance,
} from '@/redux/slices/exploreSlice';
import { CeremonyCategory } from '@/types/home.types';
import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';

import { FilterSectionHeader } from './FilterSectionHeader';
import { FilterChip } from './FilterChip';
import { SegmentedControl } from './SegmentedControl';
import { PriceRangeSlider } from './PriceRangeSlider';
import { DistanceSlider } from './DistanceSlider';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SNAP_POINTS = ['75%'];
const BACKDROP_OPACITY = 0.5;

const RATING_OPTIONS = [
  { label: 'Any', value: null },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
] as const;

const LANGUAGES = [
  'Hindi', 'Sanskrit', 'English', 'Telugu', 'Tamil',
  'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati',
  'Punjabi', 'Odia',
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for FilterBottomSheet. */
export interface FilterBottomSheetProps {
  /** Controls whether the sheet is expanded. */
  isVisible: boolean;
  /** Called when the sheet is dismissed without applying. */
  onClose: () => void;
  /** Called when the user taps the apply CTA. */
  onApply: () => void;
  /** Available ceremony categories to display as chips. */
  categories: CeremonyCategory[];
  /** Total result count from the latest query for the CTA label. */
  resultCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the backdrop component for the bottom sheet.
 */
function renderBackdrop(props: BottomSheetBackdropProps): React.JSX.Element {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={BACKDROP_OPACITY}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Full-featured filter sheet for the Explore Tab.
 * Opens at 75% screen height; dispatches directly to exploreSlice.
 */
export default function FilterBottomSheet({
  isVisible,
  onClose,
  onApply,
  categories,
  resultCount,
}: FilterBottomSheetProps): React.JSX.Element | null {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);

  const filters = useSelector((state: RootState) => state.explore);
  const snapPoints = useMemo(() => SNAP_POINTS, []);

  // Open/close sheet in response to isVisible prop changes
  React.useEffect(() => {
    if (isVisible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetClose = useCallback(() => {
    onClose();
  }, [onClose]);

  function handleApply(): void {
    onApply();
    onClose();
  }

  const applyLabel = `Show ${resultCount} Pandits`;

  return (
    <BottomSheet
      ref={sheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleSheetClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity
          onPress={() => dispatch(resetFilters())}
          accessibilityRole="button"
          accessibilityLabel="Reset all filters"
        >
          <Text style={styles.resetLabel}>Reset all</Text>
        </TouchableOpacity>
      </View>

      {/* ── Scrollable sections ── */}
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: THEME.spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FilterSectionHeader title="CEREMONY TYPE" />
        <View style={styles.chipsRow}>
          {categories.map((cat) => (
            <FilterChip
              key={cat._id}
              label={cat.name}
              isSelected={filters.ceremonyTypes.includes(cat._id)}
              onPress={() => dispatch(toggleCeremonyType(cat._id))}
            />
          ))}
        </View>

        <FilterSectionHeader title="LANGUAGE" />
        <View style={styles.chipsRow}>
          {LANGUAGES.map((lang) => (
            <FilterChip
              key={lang}
              label={lang}
              isSelected={filters.languages.includes(lang)}
              onPress={() => dispatch(toggleLanguage(lang))}
            />
          ))}
        </View>

        <FilterSectionHeader title="MINIMUM RATING" />
        <SegmentedControl
          options={RATING_OPTIONS as unknown as { label: string; value: number | null }[]}
          selectedValue={filters.minRating}
          onChange={(val) => dispatch(setMinRating(val))}
        />

        <FilterSectionHeader title="PRICE RANGE" />
        <PriceRangeSlider
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={(min, max) => dispatch(setPriceRange({ min, max }))}
        />

        <FilterSectionHeader title="MAXIMUM DISTANCE" />
        <DistanceSlider
          maxDistanceKm={filters.maxDistanceKm}
          onChange={(km) => dispatch(setMaxDistance(km))}
        />
      </BottomSheetScrollView>

      {/* ── Fixed apply button ── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + THEME.spacing.md },
        ]}
      >
        <View style={styles.footerDivider} />
        <View style={styles.footerInner}>
          <PrimaryButton title={applyLabel} onPress={handleApply} />
          <Text style={styles.footerHint}>
            {`${resultCount} pandits match your filters`}
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: THEME.colors.surface,
  },
  handle: {
    backgroundColor: THEME.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  headerTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  resetLabel: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  footer: {
    backgroundColor: THEME.colors.surface,
  },
  footerDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  footerInner: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  footerHint: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
});
