import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';
import { StepRef } from '@/types/stepRef.types';

/**
 * Step 5: Regular Availability component (Stub).
 */
export const Step5Availability = forwardRef<StepRef, {}>((_, ref) => {
  useImperativeHandle(ref, () => ({
    validate: () => true,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Step 5: Regular Weekly Schedule</Text>
    </View>
  );
});

Step5Availability.displayName = 'Step5Availability';

const styles = StyleSheet.create({
  container: {
    padding: THEME.spacing.md,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
});
