/**
 * ExploreHeader — component combining title, search bar, and suggestions overlay.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SearchSuggestion } from '@/types/explore.types';
import { THEME } from '@/constants/theme';
import ExploreSearchBar from './ExploreSearchBar';
import SuggestionDropdown from './SuggestionDropdown';

export interface ExploreHeaderProps {
  title: string;
  searchInput: string;
  onChangeSearchInput: (text: string) => void;
  isSuggestionOpen: boolean;
  setIsSuggestionOpen: (open: boolean) => void;
  suggestions: SearchSuggestion[];
  isLoadingSuggestions: boolean;
  filterCount: number;
  onFilterPress: () => void;
  autoFocus: boolean;
  onSuggestionPress: (suggestion: SearchSuggestion) => void;
  onSearchSubmit: (query: string) => void;
  onSearchClear: () => void;
  onFocus?: () => void;
}

/** Header wrapper for discoverability and layout simplicity. */
export function ExploreHeader({
  title,
  searchInput,
  onChangeSearchInput,
  isSuggestionOpen,
  setIsSuggestionOpen,
  suggestions,
  isLoadingSuggestions,
  filterCount,
  onFilterPress,
  autoFocus,
  onSuggestionPress,
  onSearchSubmit,
  onSearchClear,
  onFocus,
}: ExploreHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.searchWrap}>
        <ExploreSearchBar
          value={searchInput}
          onChangeText={onChangeSearchInput}
          onSubmit={onSearchSubmit}
          onClear={onSearchClear}
          autoFocus={autoFocus}
          filterCount={filterCount}
          onFilterPress={onFilterPress}
          onFocus={onFocus}
        />
        <SuggestionDropdown
          visible={isSuggestionOpen}
          suggestions={suggestions}
          query={searchInput}
          isLoading={isLoadingSuggestions}
          onSuggestionPress={onSuggestionPress}
          onSearchPress={onSearchSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    zIndex: 10,
  },
  title: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  searchWrap: {
    zIndex: 20,
    position: 'relative',
  },
});
