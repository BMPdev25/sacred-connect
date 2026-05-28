/**
 * FilterBottomSheet — slide-up panel for configuring priest search filters.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';
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
import { RATING_OPTIONS, LANGUAGES } from '@/constants/explore';
import PrimaryButton from '@/components/shared/PrimaryButton';

import { FilterSectionHeader } from './FilterSectionHeader';
import { FilterChip } from './FilterChip';
import { SegmentedControl } from './SegmentedControl';
import { PriceRangeSlider } from './PriceRangeSlider';
import { DistanceSlider } from './DistanceSlider';

const SNAP_POINTS = ['75%'];
const BACKDROP_OPACITY = 0.5;

/** Props for FilterBottomSheet. */
export interface FilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: () => void;
  categories: CeremonyCategory[];
  resultCount: number;
}

function renderBackdrop(props: BottomSheetBackdropProps): React.JSX.Element {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={BACKDROP_OPACITY} />;
}

/** Filter sheet for discoverability. */
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

  React.useEffect(() => {
    if (isVisible) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [isVisible]);

  function handleApply(): void {
    onApply();
    onClose();
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={() => dispatch(resetFilters())} accessibilityRole="button">
          <Text style={styles.resetLabel}>Reset all</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: THEME.spacing.xxl }]}
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
          options={RATING_OPTIONS as any}
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + THEME.spacing.md }]}>
        <View style={styles.footerDivider} />
        <View style={styles.footerInner}>
          <PrimaryButton title={`Show ${resultCount} Pandits`} onPress={handleApply} />
          <Text style={styles.footerHint}>{`${resultCount} pandits match your filters`}</Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: THEME.colors.surface },
  handle: { backgroundColor: THEME.colors.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  headerTitle: { fontSize: THEME.typography.subheading, fontWeight: '700', color: THEME.colors.textPrimary },
  resetLabel: { fontSize: THEME.typography.body, color: THEME.colors.primary, fontWeight: '500' },
  scrollContent: { paddingHorizontal: THEME.spacing.lg },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: THEME.spacing.sm },
  footer: { backgroundColor: THEME.colors.surface },
  footerDivider: { height: 1, backgroundColor: THEME.colors.border },
  footerInner: { paddingHorizontal: THEME.spacing.lg, paddingTop: THEME.spacing.md, gap: THEME.spacing.sm },
  footerHint: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textMuted, textAlign: 'center' },
});
