import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { DetailCard } from './DetailCard';
import { StarRatingRow } from './StarRatingRow';

interface RateDetailsSectionProps {
  punctuality: number;
  setPunctuality: (val: number) => void;
  knowledge: number;
  setKnowledge: (val: number) => void;
  behavior: number;
  setBehavior: (val: number) => void;
}

/**
 * RateDetailsSection displays detailed category ratings for review.
 *
 * @param props.punctuality - Value for punctuality rating.
 * @param props.setPunctuality - Setter callback for punctuality.
 * @param props.knowledge - Value for knowledge rating.
 * @param props.setKnowledge - Setter callback for knowledge.
 * @param props.behavior - Value for behavior rating.
 * @param props.setBehavior - Setter callback for behavior.
 */
export function RateDetailsSection({
  punctuality,
  setPunctuality,
  knowledge,
  setKnowledge,
  behavior,
  setBehavior,
}: RateDetailsSectionProps): React.JSX.Element {
  return (
    <DetailCard title="Rate the details">
      <View style={styles.detailRowWrapper}>
        <StarRatingRow label="Punctuality" value={punctuality} onChange={setPunctuality} size={20} />
      </View>
      <View style={styles.divider} />
      <View style={styles.detailRowWrapper}>
        <StarRatingRow label="Knowledge" value={knowledge} onChange={setKnowledge} size={20} />
      </View>
      <View style={styles.divider} />
      <View style={styles.detailRowWrapper}>
        <StarRatingRow label="Behavior" value={behavior} onChange={setBehavior} size={20} />
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  detailRowWrapper: { paddingVertical: 4 },
  divider: { height: 1, backgroundColor: THEME.colors.border, marginVertical: 8 },
});
