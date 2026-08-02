/**
 * SuggestionRow & presentation sub-components for search suggestions.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SearchSuggestion } from '@/types/explore.types';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROW_HEIGHT = 48;
const ACCENT_WIDTH = 3;
const ACCENT_HEIGHT = 32;
const DIVIDER_MARGIN_LEFT = 16;

// ---------------------------------------------------------------------------
// Types & Props
// ---------------------------------------------------------------------------

interface HighlightedTextProps {
  text: string;
  query: string;
}

interface SuggestionRowProps {
  suggestion: SearchSuggestion;
  query: string;
  onPress: (suggestion: SearchSuggestion) => void;
  showDivider: boolean;
}

interface SearchActionRowProps {
  query: string;
  onPress: (query: string) => void;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/**
 * Renders a single grey shimmer skeleton row for the loading state.
 */
export function SkeletonRow(): React.JSX.Element {
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonText} />
    </View>
  );
}

/**
 * Renders text with the matched portion of the query shown in bold/dark.
 * Case-insensitive match; falls back to plain text when no match is found.
 */
export function HighlightedText({ text, query }: HighlightedTextProps): React.JSX.Element {
  if (!query) {
    return <Text style={styles.suggestionText}>{text}</Text>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return <Text style={styles.suggestionText}>{text}</Text>;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.length);
  const after = text.slice(matchIndex + query.length);

  return (
    <Text style={styles.suggestionText}>
      <Text style={styles.suggestionTextNormal}>{before}</Text>
      <Text style={styles.suggestionTextBold}>{match}</Text>
      <Text style={styles.suggestionTextNormal}>{after}</Text>
    </Text>
  );
}

/**
 * A single tappable suggestion row with an accent bar, icon, highlighted
 * text, and a type badge on the right.
 */
export function SuggestionRow({
  suggestion,
  query,
  onPress,
  showDivider,
}: SuggestionRowProps): React.JSX.Element {
  const iconName = suggestion.type === 'ceremony' ? 'search-outline' : 'person-outline';
  const badgeLabel = suggestion.type === 'ceremony' ? 'CEREMONY' : 'PANDIT';

  return (
    <>
      <TouchableOpacity
        style={styles.suggestionRow}
        onPress={() => onPress(suggestion)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={suggestion.text}
      >
        <View style={styles.accentBar} />
        <Ionicons name={iconName} size={16} color={THEME.colors.textSecondary} />
        <View style={styles.suggestionTextWrap}>
          <HighlightedText text={suggestion.text} query={query} />
        </View>
        <Text style={styles.typeBadge}>{badgeLabel}</Text>
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

/**
 * The final "Search for X" action row, always shown when query is non-empty.
 */
export function SearchActionRow({ query, onPress }: SearchActionRowProps): React.JSX.Element {
  return (
    <>
      <View style={styles.divider} />
      <TouchableOpacity
        style={styles.searchActionRow}
        onPress={() => onPress(query)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${query}`}
      >
        <Ionicons name="search-outline" size={16} color={THEME.colors.primary} />
        <Text style={styles.searchActionText}>
          {'Search for '}
          <Text style={styles.searchActionQuery}>{`"${query}"`}</Text>
        </Text>
      </TouchableOpacity>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  suggestionRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  accentBar: {
    width: ACCENT_WIDTH,
    height: ACCENT_HEIGHT,
    backgroundColor: THEME.colors.primary,
    borderRadius: 2,
    marginRight: THEME.spacing.sm,
  },
  suggestionTextWrap: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  suggestionText: {
    fontSize: THEME.typography.body,
  },
  suggestionTextNormal: {
    fontWeight: '400',
    color: THEME.colors.textSecondary,
  },
  suggestionTextBold: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  typeBadge: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginLeft: DIVIDER_MARGIN_LEFT,
  },
  searchActionRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  searchActionText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  searchActionQuery: {
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  skeletonRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: THEME.colors.border,
  },
  skeletonText: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    backgroundColor: THEME.colors.border,
  },
});
