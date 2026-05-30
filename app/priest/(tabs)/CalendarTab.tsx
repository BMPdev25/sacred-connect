import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '@/constants/theme';

export default function CalendarTab(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calendar Tab Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
  },
  text: {
    fontSize: THEME.typography.heading,
    color: THEME.colors.textPrimary,
  },
});
