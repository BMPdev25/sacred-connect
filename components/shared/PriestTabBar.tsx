/**
 * PriestTabBar — custom bottom tab bar used exclusively by the priest tab navigator.
 * Renders filled/outline Ionicons, an active dot indicator, and respects the home
 * indicator safe area via useSafeAreaInsets.
 * Includes a badge for the Requests tab based on Redux state.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Ordered tab configuration matching the Tabs.Screen declaration order. */
const TAB_CONFIG = [
  { name: 'HomeTab',     label: 'Home',     icon: 'home' },
  { name: 'RequestsTab', label: 'Requests', icon: 'list' },
  { name: 'CalendarTab', label: 'Calendar', icon: 'calendar' },
  { name: 'EarningsTab', label: 'Earnings', icon: 'cash' },
  { name: 'ProfileTab',  label: 'Profile',  icon: 'person' },
] as const;

type IconName = (typeof TAB_CONFIG)[number]['icon'];

// ---------------------------------------------------------------------------
// Helper — find active tab index
// ---------------------------------------------------------------------------

function getTabIndex(
  routes: BottomTabBarProps['state']['routes'],
  targetName: string
): number {
  return routes.findIndex((r) => r.name === targetName);
}

// ---------------------------------------------------------------------------
// Sub-component — individual tab item
// ---------------------------------------------------------------------------

interface TabItemProps {
  label: string;
  iconName: IconName;
  isActive: boolean;
  onPress: () => void;
  badgeCount?: number;
}

function TabItem({ label, iconName, isActive, onPress, badgeCount = 0 }: TabItemProps): React.JSX.Element {
  const resolvedIcon = isActive ? iconName : (`${iconName}-outline` as any);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={resolvedIcon}
          size={24}
          color={isActive ? THEME.colors.primary : THEME.colors.textMuted}
        />
        {isActive && <View style={styles.activeDot} />}
        {badgeCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.label,
          isActive ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PriestTabBar({
  state,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  
  // Get pending requests count from Redux
  const pendingRequestsCount = useSelector((state: RootState) => state.priestDashboard.pendingRequestsCount);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TAB_CONFIG.map((tab) => {
        const tabIndex = getTabIndex(state.routes, tab.name);
        const isActive = state.index === tabIndex;

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[tabIndex]?.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };
        
        // Pass badge count only for the Requests tab
        const badgeCount = tab.name === 'RequestsTab' ? pendingRequestsCount : 0;

        return (
          <TabItem
            key={tab.name}
            label={tab.label}
            iconName={tab.icon}
            isActive={isActive}
            onPress={handlePress}
            badgeCount={badgeCount}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 5,
    height: 5,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.primary,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: THEME.colors.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.surface,
  },
  badgeText: {
    color: THEME.colors.surface,
    fontSize: 8,
    fontWeight: 'bold',
  },
  label: {
    fontSize: THEME.typography.caption,
    marginTop: 10,
  },
  labelActive: {
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  labelInactive: {
    fontWeight: '400',
    color: THEME.colors.textMuted,
  },
});
