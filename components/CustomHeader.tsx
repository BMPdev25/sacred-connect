// src/components/CustomHeader.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APP_COLORS } from '../config';

const CustomHeader = ({ title, showBackButton, onBackPress, renderRightContent }) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
          </TouchableOpacity>
        )}
      </View>

      {title === 'Sacred Connect' ? (
        <Text style={styles.appTitleText}>Sacred Connect</Text>
      ) : (
        <Text style={styles.titleText}>{title}</Text>
      )}

      <View style={styles.rightContainer}>
        {renderRightContent ? renderRightContent() : <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
    elevation: 2,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  appTitleText: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontSize: 24,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.black,
  },
  placeholder: {
    width: 24,
    height: 24,
  },
});

export default CustomHeader;