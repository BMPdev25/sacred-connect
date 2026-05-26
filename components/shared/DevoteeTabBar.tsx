/**
 * DevoteeTabBar — custom bottom tab bar used exclusively by the devotee tab navigator.
 * Renders filled/outline Ionicons, an active dot indicator, and respects the home
 * indicator safe area via useSafeAreaInsets.
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

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Ordered tab configuration matching the Tabs.Screen declaration order. */
const TAB_CONFIG = [
  { name: 'HomeTab',    label: 'Home',     icon: 'home' },
  { name: 'ExploreTab', label: 'Explore',  icon: 'compass' },
  { name: 'BookingsTab',label: 'Bookings', icon: 'calendar' },
  { name: 'ProfileTab', label: 'Profile',  icon: 'person' },
] as const;

type IconName = (typeof TAB_CONFIG)[number]['icon'];

// ---------------------------------------------------------------------------
// Helper — find active tab index
// ---------------------------------------------------------------------------

/**
 * Returns the index of the route whose name matches targetName.
 *
 * @param routes - The tab navigator's route array.
 * @param targetName - The route name to search for.
 * @returns Matched index, or -1 if not found.
 */
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
  /** Display label shown beneath the icon. */
  label: string;
  /** Base icon name (without "-outline" suffix). */
  iconName: IconName;
  /** Whether this tab is the currently active route. */
  isActive: boolean;
  /** Handler called when the user presses this tab. */
  onPress: () => void;
}

/**
 * Renders a single tab item with a filled/outline icon, active dot, and label.
 */
function TabItem({ label, iconName, isActive, onPress }: TabItemProps): React.JSX.Element {
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

/**
 * DevoteeTabBar renders the custom bottom navigation bar for devotee screens.
 * It receives Expo Router's BottomTabBarProps and maps them onto TabItem components.
 */
export default function DevoteeTabBar({
  state,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

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

        return (
          <TabItem
            key={tab.name}
            label={tab.label}
            iconName={tab.icon}
            isActive={isActive}
            onPress={handlePress}
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
