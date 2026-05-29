import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { PublicPriestProfile } from '@/types/priestDetails.types';

export interface AboutSectionProps {
  bio?: string;
  specializations: PublicPriestProfile['specializations'];
}

export function AboutSection({ bio, specializations }: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 120;
  
  const hasBio = Boolean(bio && bio.trim().length > 0);
  const needsTruncation = hasBio && bio!.length > maxChars;
  
  const displayBio = !hasBio 
    ? 'No bio provided.' 
    : (expanded || !needsTruncation) 
      ? bio 
      : `${bio!.substring(0, maxChars)}...`;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>About</Text>
      
      <Text style={styles.bioText}>{displayBio}</Text>
      
      {needsTruncation && (
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      )}

      {specializations && specializations.length > 0 && (
        <View style={styles.specializationsContainer}>
          <Text style={styles.subheading}>Specializations</Text>
          <View style={styles.pillRow}>
            {specializations.map((spec, index) => (
              <View key={`${spec.name}-${index}`} style={styles.pill}>
                <Text style={styles.pillText}>{spec.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface,
  },
  heading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  bioText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: THEME.spacing.xs,
  },
  readMoreText: {
    color: THEME.colors.primary,
    fontWeight: '600',
    fontSize: THEME.typography.bodySmall,
  },
  specializationsContainer: {
    marginTop: THEME.spacing.lg,
  },
  subheading: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pillText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
});
