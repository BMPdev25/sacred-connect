import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { THEME } from '@/constants/theme';
import { usePriestProfile } from '@/hooks/usePriestDetails';
import { AssetService } from '@/services/assets/AssetService';
import { StarDisplay } from '@/components/shared/StarDisplay';

interface PriestMiniCardProps {
  priestProfileId: string;
}

/**
 * A non-interactive mini card displaying the priest's essential details.
 * Reads data synchronously from the React Query cache.
 */
export function PriestMiniCard({ priestProfileId }: PriestMiniCardProps) {
  const { data: priest } = usePriestProfile(priestProfileId);

  if (!priest) {
    // Skeleton placeholder when data is unexpectedly missing
    return (
      <View style={[styles.card, styles.skeletonCard]}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
        </View>
      </View>
    );
  }

  const avatarSource = priest.profilePicture
    ? { uri: priest.profilePicture }
    : AssetService.getImage('shared.avatarPlaceholder');

  return (
    <View style={styles.card}>
      <Image source={avatarSource as any} style={styles.avatar} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {priest.name}
        </Text>
        <View style={styles.ratingRow}>
          <StarDisplay rating={priest.ratings.average} size={12} />
          <Text style={styles.ratingText}>
            {priest.ratings.average.toFixed(1)} ({priest.ratings.count} reviews)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    margin: THEME.spacing.md,
    padding: 12,
    borderRadius: THEME.borderRadius.lg,
    ...THEME.shadow.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  name: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.gold,
    marginLeft: 6,
    fontWeight: '500',
  },
  skeletonCard: {
    opacity: 0.7,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.border,
  },
  skeletonContent: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  skeletonLineShort: {
    width: '40%',
    marginBottom: 0,
  },
});
