import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';

/**
 * Hook to manage the animated opacity of the collapsed header based on scroll position.
 * Returns the scrollY animated value, the interpolated opacity, and the onScroll event handler.
 *
 * @returns Object with Animated values and onScroll handler to be used by the parent ScrollView.
 */
export function useCollapsedHeader() {
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const opacity = scrollY.interpolate({
    inputRange: [200, 280],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return { scrollY, opacity, onScroll };
}

interface CollapsedHeaderProps {
  /** The name of the priest to display in the header */
  name: string;
  /** Animated value or interpolation representing the opacity (0 to 1) */
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value;
}

/**
 * Absolute positioned collapsed header that fades in as the user scrolls down.
 */
export function CollapsedHeader({ name, opacity }: CollapsedHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isInteractive, setIsInteractive] = useState(false);
  const interactiveRef = useRef(isInteractive);

  useEffect(() => {
    interactiveRef.current = isInteractive;
  }, [isInteractive]);

  useEffect(() => {
    const id = opacity.addListener(({ value }) => {
      const shouldBeInteractive = value > 0.05;
      if (interactiveRef.current !== shouldBeInteractive) {
        setIsInteractive(shouldBeInteractive);
      }
    });

    return () => {
      opacity.removeListener(id);
    };
  }, [opacity]);

  const onShare = async () => {
    try {
      await Share.share({ message: `${name} on Sacred Connect` });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Animated.View
      pointerEvents={isInteractive ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          height: insets.top + 56,
          paddingTop: insets.top,
          opacity,
        },
      ]}
    >
      <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>

      <TouchableOpacity style={styles.iconButton} onPress={onShare}>
        <Ionicons name="share-outline" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    zIndex: 20,
  },
  iconButton: {
    padding: 8,
  },
  name: {
    flex: 1,
    textAlign: 'center',
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginHorizontal: 16,
  },
});
