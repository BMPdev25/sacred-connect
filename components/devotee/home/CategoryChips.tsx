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
 * Each chip navigates the user to the ExploreTab.
 */
export default function CategoryChips({ categories }: CategoryChipsProps): React.JSX.Element | null {
  const router = useRouter();

  if (categories.length === 0) return null;

  const handleChipPress = (category: CeremonyCategory) => {
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
        {categories.map((cat) => (
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
