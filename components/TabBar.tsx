// src/components/TabBar.js
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { APP_COLORS } from '../constants/Colors';

export type TabItem = {
  key: string | number;
  label: string;
};

type TabBarProps = {
  tabs: TabItem[];
  activeTab: string | number;
  onTabChange: (key: string | number) => void;
  tabStyle?: StyleProp<ViewStyle>;
  activeTabStyle?: StyleProp<ViewStyle>;
  tabTextStyle?: StyleProp<TextStyle>;
  activeTabTextStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const TabBar: React.FC<TabBarProps> = ({
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
          key={String(tab.key)}
          style={[
            styles.tabButton,
            tabStyle,
            activeTab === tab.key && styles.activeTabButton,
            activeTab === tab.key && (activeTabStyle as any),
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              tabTextStyle,
              activeTab === tab.key && styles.activeTabText,
              activeTab === tab.key && (activeTabTextStyle as any),
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