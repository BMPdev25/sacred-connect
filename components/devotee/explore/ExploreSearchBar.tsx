/**
 * ExploreSearchBar — horizontal row containing a real TextInput for search
 * and a filter icon button with an active-filter count badge.
 *
 * Extracted hook: useFocusState — manages focus colour transitions.
 */

import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_HEIGHT = 48;
const BUTTON_SIZE = 48;
const BADGE_SIZE = 20;
const BORDER_WIDTH = 1.5;
const FILTER_BORDER_WIDTH = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for ExploreSearchBar. */
export interface ExploreSearchBarProps {
  /** Current text value of the search input. */
  value: string;
  /** Called when input text changes. */
  onChangeText: (text: string) => void;
  /** Called when the user submits the search (return key or submit). */
  onSubmit: (text: string) => void;
  /** Called when the clear (×) button is pressed. */
  onClear: () => void;
  /** Optional callback when the input is focused. */
  onFocus?: () => void;
  /** If true, the input grabs keyboard focus on mount. */
  autoFocus?: boolean;
  /** Number of currently active filters — drives badge visibility. */
  filterCount: number;
  /** Called when the filter button is pressed. */
  onFilterPress: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface FocusState {
  isFocused: boolean;
  handleFocus: () => void;
  handleBlur: () => void;
}

/**
 * Tracks TextInput focus to adjust border and icon colours.
 */
function useFocusState(): FocusState {
  const [isFocused, setIsFocused] = useState(false);
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  return { isFocused, handleFocus, handleBlur };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FilterBadgeProps {
  count: number;
}

/**
 * Small circular badge showing the active-filter count.
 * Only rendered when count > 0.
 */
function FilterBadge({ count }: FilterBadgeProps): React.JSX.Element | null {
  if (count <= 0) return null;
  return (
    <View style={styles.badge} accessibilityLabel={`${count} filters active`}>
      <Text style={styles.badgeText}>{count.toString()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Search bar with a TextInput (flex 1) and an adjacent filter button.
 * The input border colour transitions between saffron (focused) and grey.
 * A count badge appears on the filter button when filters are active.
 */
export default function ExploreSearchBar(
  props: ExploreSearchBarProps,
): React.JSX.Element {
  const {
    value, onChangeText, onSubmit, onClear,
    onFocus, autoFocus = false, filterCount, onFilterPress,
  } = props;

  const { isFocused, handleFocus, handleBlur } = useFocusState();
  const inputRef = useRef<TextInput>(null);

  function handleFocusInternal() {
    handleFocus();
    onFocus?.();
  }

  const borderColor = isFocused
    ? THEME.colors.borderActive
    : THEME.colors.border;

  const iconColor = isFocused ? THEME.colors.primary : THEME.colors.textMuted;

  return (
    <View style={styles.row}>
      {/* ── Search input ── */}
      <View style={[styles.inputContainer, { borderColor }]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={iconColor}
        />

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search by name, puja..."
          placeholderTextColor={THEME.colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => onSubmit(value)}
          onFocus={handleFocusInternal}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          clearButtonMode="never"
          accessibilityLabel="Search priests and ceremonies"
          accessibilityRole="search"
        />

        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            style={styles.clearButton}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={THEME.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter button ── */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onFilterPress}
        activeOpacity={0.75}
        accessibilityLabel={
          filterCount > 0
            ? `Filters, ${filterCount} active`
            : 'Open filters'
        }
        accessibilityRole="button"
      >
        <Ionicons
          name="options-outline"
          size={22}
          color={THEME.colors.primary}
        />
        <FilterBadge count={filterCount} />
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    height: INPUT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: BORDER_WIDTH,
    paddingHorizontal: THEME.spacing.md,
  },
  input: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    marginLeft: THEME.spacing.sm,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: THEME.spacing.sm,
  },
  filterButton: {
    marginLeft: THEME.spacing.sm,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: FILTER_BORDER_WIDTH,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.surface,
  },
});
