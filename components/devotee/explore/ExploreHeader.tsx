/**
 * ExploreHeader -- component combining title, search bar, and unified search dropdown.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';
import { CeremonySearchResult, PriestSearchResult } from '@/types/explore.types';
import ExploreSearchBar from './ExploreSearchBar';
import UnifiedSearchDropdown from './UnifiedSearchDropdown';

export interface ExploreHeaderProps {
  title: string;
  searchInput: string;
  onChangeSearchInput: (text: string) => void;
  isSuggestionOpen: boolean;
  setIsSuggestionOpen: (open: boolean) => void;
  ceremonies: CeremonySearchResult[];
  priests: PriestSearchResult[];
  isLoadingSearch: boolean;
  filterCount: number;
  onFilterPress: () => void;
  autoFocus: boolean;
  onCeremonyPress: (ceremonyId: string) => void;
  onPriestPress: (priestProfileId: string, userId: string) => void;
  onSearchAllPandits: (query: string) => void;
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
  ceremonies,
  priests,
  isLoadingSearch,
  filterCount,
  onFilterPress,
  autoFocus,
  onCeremonyPress,
  onPriestPress,
  onSearchAllPandits,
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
        <UnifiedSearchDropdown
          visible={isSuggestionOpen}
          query={searchInput}
          ceremonies={ceremonies}
          priests={priests}
          isLoading={isLoadingSearch}
          onCeremonyPress={(id) => {
            setIsSuggestionOpen(false);
            onCeremonyPress(id);
          }}
          onPriestPress={(priestId, userId) => {
            setIsSuggestionOpen(false);
            onPriestPress(priestId, userId);
          }}
          onSearchAllPandits={(q) => {
            setIsSuggestionOpen(false);
            onSearchAllPandits(q);
          }}
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
