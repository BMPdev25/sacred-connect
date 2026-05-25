import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';

/** Handle interface for step validation refs. */
export interface StepRef {
  /** Validates the step's input fields. Returns true if valid. */
  validate: () => boolean;
}

/**
 * Step 1: Basic Info component (Stub).
 */
export const Step1BasicInfo = forwardRef<StepRef, {}>((_, ref) => {
  useImperativeHandle(ref, () => ({
    validate: () => true,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Step 1: Basic Profile & Languages Spoken</Text>
    </View>
  );
});

Step1BasicInfo.displayName = 'Step1BasicInfo';

const styles = StyleSheet.create({
  container: {
    padding: THEME.spacing.md,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
});
