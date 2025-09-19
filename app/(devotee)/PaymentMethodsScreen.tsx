import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APP_COLORS } from '../../constants/Colors';

const paymentMethods = [
  {
    key: 'card',
    label: 'Credit/Debit Card',
    icon: require('../../assets/visa-logo.png'),
  },
  {
    key: 'upi',
    label: 'UPI',
    icon: require('../../assets/upi-logo.png'),
  },
  {
    key: 'netbanking',
    label: 'Net Banking',
    icon: require('../../assets/mastercard-logo.png'),
  },
  {
    key: 'wallet',
    label: 'Wallets',
    icon: require('../../assets/default-profile.png'), // Replace with wallet icon if available
  },
];

const PaymentMethodsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
      </View>
      {paymentMethods.map((method) => (
        <View key={method.key} style={styles.methodRow}>
          <Image source={method.icon} style={styles.methodIcon} />
          <Text style={styles.methodText}>{method.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 1,
  },
  methodIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginRight: 16,
  },
  methodText: {
    fontSize: 16,
    color: APP_COLORS.primary,
  },
});

export default PaymentMethodsScreen; 