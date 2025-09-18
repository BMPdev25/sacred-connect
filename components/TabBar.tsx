// src/components/TabBar.js
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APP_COLORS } from '../config';

const TabBar = ({
  tabs,
  activeTab,
  onTabChange,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  containerStyle,
}) => {
  return (
    <View style={[styles.tabContainer, containerStyle]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            tabStyle,
            activeTab === tab.key && styles.activeTabButton,
            activeTab === tab.key && activeTabStyle,
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              tabTextStyle,
              activeTab === tab.key && styles.activeTabText,
              activeTab === tab.key && activeTabTextStyle,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: APP_COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: APP_COLORS.gray,
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
});

export default TabBar;