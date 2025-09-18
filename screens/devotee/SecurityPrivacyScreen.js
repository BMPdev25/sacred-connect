import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../config';

const SecurityPrivacyScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
      </View>
      <TouchableOpacity style={styles.optionRow}>
        <Ionicons name="lock-closed-outline" size={22} color={APP_COLORS.primary} />
        <Text style={styles.optionText}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionRow}>
        <Ionicons name="shield-outline" size={22} color={APP_COLORS.primary} />
        <Text style={styles.optionText}>Two-Factor Authentication</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionRow}>
        <Ionicons name="phone-portrait-outline" size={22} color={APP_COLORS.primary} />
        <Text style={styles.optionText}>Manage Devices</Text>
      </TouchableOpacity>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 1,
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
    color: APP_COLORS.primary,
  },
});

export default SecurityPrivacyScreen; 