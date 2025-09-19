import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_COLORS } from '../../constants/Colors';

const AvailableOffersScreen = ({ route }: any) => {
  const { ceremony }: any = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Offers</Text>
      <Text style={styles.ceremonyName}>For: {ceremony?.name || 'Ceremony'}</Text>
      <Text style={styles.placeholder}>This is where available offers for this ceremony will be shown.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    marginBottom: 16,
  },
  ceremonyName: {
    fontSize: 18,
    color: APP_COLORS.gray,
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 15,
    color: APP_COLORS.gray,
    textAlign: 'center',
  },
});

export default AvailableOffersScreen; 