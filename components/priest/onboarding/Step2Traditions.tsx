import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';
import { StepRef } from './Step1BasicInfo';

/**
 * Step 2: Religious Traditions component (Stub).
 */
export const Step2Traditions = forwardRef<StepRef, {}>((_, ref) => {
  useImperativeHandle(ref, () => ({
    validate: () => true,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Step 2: Religious Traditions & Specializations</Text>
    </View>
  );
});

Step2Traditions.displayName = 'Step2Traditions';

const styles = StyleSheet.create({
  container: {
    padding: THEME.spacing.md,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
});
