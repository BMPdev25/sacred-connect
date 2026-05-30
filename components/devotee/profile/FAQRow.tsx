import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { FAQItem } from '@/types/profile.types';

interface FAQRowProps {
  /** The FAQ data model containing id, question, and answer */
  item: FAQItem;
  /** Indicates if this specific FAQ item is currently expanded */
  isOpen: boolean;
  /** Callback triggered when clicking the FAQ item to expand/collapse it */
  onToggle: () => void;
  /** Indicates if this row is the last item in the list (suppresses divider) */
  isLast: boolean;
}

/**
 * Renders an accordion FAQ item with animated chevron indicator.
 * Smoothly collapses/expands the answer text area.
 */
export function FAQRow({ item, isOpen, onToggle, isLast }: FAQRowProps): React.JSX.Element {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, animatedValue]);

  const rotateInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.rowContainer}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.headerRow}
      >
        <Text style={styles.questionText}>{item.question}</Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Ionicons name="chevron-down" size={20} color={THEME.colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}

      {!isLast && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
  },
  questionText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
    paddingRight: THEME.spacing.sm,
  },
  answerContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: THEME.spacing.sm,
  },
  answerText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.md,
  },
});
