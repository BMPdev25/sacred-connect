/**
 * FestivalRow — a single upcoming festival displayed as a date-block + text row.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FestivalParsed } from '@/types/home.types';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DateBlockProps {
  day: string;
  month: string;
}

/**
 * Renders the coloured square showing the day number and month abbreviation.
 */
function DateBlock({ day, month }: DateBlockProps): React.JSX.Element {
  return (
    <View style={styles.dateBlock}>
      <Text style={styles.dayNumber}>{day}</Text>
      <Text style={styles.monthShort}>{month}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface FestivalRowProps {
  festival: FestivalParsed;
  isLast?: boolean;
}

/**
 * Displays a festival as a date block on the left with name and description on the right.
 */
export default function FestivalRow({ festival, isLast = false }: FestivalRowProps): React.JSX.Element {
  return (
    <View style={[styles.row, isLast ? null : styles.rowBorder]}>
      <DateBlock day={festival.dayNumber} month={festival.monthShort} />
      <View style={styles.textSection}>
        <Text style={styles.festivalName} numberOfLines={1}>{festival.name}</Text>
        <Text style={styles.festivalDesc} numberOfLines={1}>{festival.description}</Text>
      </View>
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
    paddingVertical: THEME.spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  dateBlock: {
    width: 52,
    height: 60,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
    flexShrink: 0,
  },
  dayNumber: {
    fontSize: THEME.typography.subheading,
    fontWeight: '800',
    color: THEME.colors.surface,
    lineHeight: 22,
  },
  monthShort: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  textSection: {
    flex: 1,
  },
  festivalName: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  festivalDesc: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
  },
});
