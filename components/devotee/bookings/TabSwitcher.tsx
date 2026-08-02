import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface TabSwitcherProps {
  activeTab: 'upcoming' | 'past';
  onSwitch: (tab: 'upcoming' | 'past') => void;
}

export function TabSwitcher({ activeTab, onSwitch }: TabSwitcherProps) {
  return (
    <View style={styles.tabSwitcherContainer}>
      <TouchableOpacity
        style={[styles.tabPill, activeTab === 'upcoming' && styles.tabPillActive]}
        onPress={() => onSwitch('upcoming')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
          Upcoming
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabPill, activeTab === 'past' && styles.tabPillActive]}
        onPress={() => onSwitch('past')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
          Past
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSwitcherContainer: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: THEME.borderRadius.pill,
    padding: 4,
  },
  tabPill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.pill,
  },
  tabPillActive: {
    backgroundColor: THEME.colors.surface,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '600',
  },
});
