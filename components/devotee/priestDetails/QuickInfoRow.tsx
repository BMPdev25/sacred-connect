import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export interface QuickInfoRowProps {
  languages: string[];
  religiousTradition: string;
}

const isObjectId = (val: string) => /^[a-f\d]{24}$/i.test(val);

const displayLanguages = (langs: string[]) =>
  langs.filter((lang) => lang && !isObjectId(lang));

export function QuickInfoRow({ languages, religiousTradition }: QuickInfoRowProps) {
  const filteredLanguages = displayLanguages(languages ?? []);
  return (
    <View style={styles.container}>
      <View style={styles.infoBlock}>
        <View style={styles.iconContainer}>
          <Ionicons name="language-outline" size={20} color={THEME.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Languages</Text>
          <Text style={styles.value} numberOfLines={1}>
            {filteredLanguages.length ? filteredLanguages.join(', ') : 'Not specified'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoBlock}>
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={20} color={THEME.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Tradition</Text>
          <Text style={styles.value} numberOfLines={1}>
            {religiousTradition || 'Not specified'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  infoBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1E6', // Light saffron tint matching primary color
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  value: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: THEME.colors.border,
    marginHorizontal: 16,
  },
});
