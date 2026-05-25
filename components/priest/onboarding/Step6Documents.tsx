import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';
import { StepRef } from '@/types/stepRef.types';

/**
 * Step 6: Verification Documents component (Stub).
 */
export const Step6Documents = forwardRef<StepRef, {}>((_, ref) => {
  useImperativeHandle(ref, () => ({
    validate: () => true,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Step 6: Document Upload & Verification</Text>
    </View>
  );
});

Step6Documents.displayName = 'Step6Documents';

const styles = StyleSheet.create({
  container: {
    padding: THEME.spacing.md,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
});
