import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';
import { StepRef } from '@/types/stepRef.types';

/**
 * Step 4: Geographic Service Area component (Stub).
 */
export const Step4ServiceArea = forwardRef<StepRef, {}>((_, ref) => {
  useImperativeHandle(ref, () => ({
    validate: () => true,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Step 4: Operating Location & Travel Radius</Text>
    </View>
  );
});

Step4ServiceArea.displayName = 'Step4ServiceArea';

const styles = StyleSheet.create({
  container: {
    padding: THEME.spacing.md,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
});
