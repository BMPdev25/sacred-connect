/**
 * CategoryChips — horizontal scrollable row of ceremony category pills.
 * Tapping a chip navigates to the ExploreTab.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CeremonyCategory } from '@/types/home.types';
import { THEME } from '@/constants/theme';

const HARDCODED_CATEGORIES: CeremonyCategory[] = [
  { _id: 'hc-1', name: 'All', isActive: true, order: 0, icon: 'apps-outline' },
  { _id: 'hc-2', name: 'Weddings', isActive: true, order: 1, icon: 'heart-outline' },
  { _id: 'hc-3', name: 'Pujas', isActive: true, order: 2, icon: 'flower-outline' },
  { _id: 'hc-4', name: 'Homams', isActive: true, order: 3, icon: 'flame-outline' },
  { _id: 'hc-5', name: 'Housewarming', isActive: true, order: 4, icon: 'home-outline' },
  { _id: 'hc-6', name: 'Samskaras', isActive: true, order: 5, icon: 'sparkles-outline' },
  { _id: 'hc-7', name: 'Ancestral', isActive: true, order: 6, icon: 'people-outline' },
];

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

interface ChipProps {
  category: CeremonyCategory;
  onPress: () => void;
}

/**
 * Renders a single tappable category chip with an optional icon.
 */
function Chip({ category, onPress }: ChipProps): React.JSX.Element {
  const iconName = category.icon || category.iconName;
  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Browse ${category.name} ceremonies`}
      accessibilityRole="button"
    >
      {iconName ? (
        <Ionicons
          name={iconName as any}
          size={16}
          color={THEME.colors.primary}
          style={styles.chipIcon}
        />
      ) : null}
      <Text style={styles.chipLabel}>{category.name}</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CategoryChipsProps {
  categories: CeremonyCategory[];
}

/**
 * Horizontal chip row for ceremony categories.
 *
 * When a category has a `ceremonyId` field it navigates to CeremonyDetails
 * (individual ceremony entry point). For category-level chips (no ceremonyId)
 * it filters the ExploreTab by category — the standard discovery path.
 *
 * TODO: once the backend returns per-ceremony chips, switch all chips to the
 * CeremonyDetails path.
 */
export default function CategoryChips({ categories }: CategoryChipsProps): React.JSX.Element {
  const router = useRouter();
  const displayCategories = categories.length > 0 ? categories : HARDCODED_CATEGORIES;

  const handleChipPress = (category: CeremonyCategory) => {
    // If the category represents a single ceremony (has ceremonyId), go to CeremonyDetails.
    if ((category as any).ceremonyId) {
      router.push({
        pathname: '/devotee/(screens)/CeremonyDetails' as any,
        params: { ceremonyId: (category as any).ceremonyId },
      });
      return;
    }
    // Otherwise filter the Explore tab by this category.
    router.navigate({
      pathname: '/devotee/(tabs)/ExploreTab' as any,
      params: { categoryId: category._id, categoryName: category.name },
    });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayCategories.map((cat) => (
          <Chip key={cat._id} category={cat} onPress={() => handleChipPress(cat)} />
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: THEME.spacing.md,
  },
  scrollContent: {
    paddingRight: THEME.spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    marginRight: THEME.spacing.sm,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipLabel: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '500',
    color: THEME.colors.textPrimary,
  },
});
