/**
 * SuggestionDropdown — absolutely positioned overlay listing autocomplete
 * suggestions below the search bar. Shows skeleton rows while loading,
 * and appends a "Search for X" action row when a query is present.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SearchSuggestion } from '@/types/explore.types';
import { THEME } from '@/constants/theme';
import { SkeletonRow, SuggestionRow, SearchActionRow } from './SuggestionRow';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 3;

// ---------------------------------------------------------------------------
// Types & Props
// ---------------------------------------------------------------------------

/** Props for SuggestionDropdown. */
export interface SuggestionDropdownProps {
  /** Controls whether the dropdown is visible. */
  visible: boolean;
  /** List of autocomplete suggestions to render. */
  suggestions: SearchSuggestion[];
  /** Current search query used for text highlighting. */
  query: string;
  /** True while suggestions are being fetched. */
  isLoading: boolean;
  /** Called when the user taps a suggestion row. */
  onSuggestionPress: (suggestion: SearchSuggestion) => void;
  /** Called when the user taps the "Search for X" row. */
  onSearchPress: (query: string) => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Dropdown overlay listing search autocomplete suggestions.
 * Renders null when not visible. Shows skeletons while loading.
 */
export default function SuggestionDropdown(
  props: SuggestionDropdownProps
): React.JSX.Element | null {
  const {
    visible,
    suggestions,
    query,
    isLoading,
    onSuggestionPress,
    onSearchPress,
  } = props;

  if (!visible) return null;

  function renderContent(): React.JSX.Element {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </>
      );
    }

    return (
      <>
        {suggestions.map((item, index) => (
          <SuggestionRow
            key={item.id}
            suggestion={item}
            query={query}
            onPress={onSuggestionPress}
            showDivider={index < suggestions.length - 1}
          />
        ))}
        {query.length > 0 && <SearchActionRow query={query} onPress={onSearchPress} />}
      </>
    );
  }

  return <View style={styles.container}>{renderContent()}</View>;
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    overflow: 'hidden',
  },
});
