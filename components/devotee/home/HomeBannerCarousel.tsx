/**
 * HomeBannerCarousel — auto-scrolling promotional banner strip.
 * Shows a colour-background fallback when no imageUrl is present.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { Banner } from '@/types/home.types';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 180;
const AUTO_SCROLL_MS = 4000;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BannerSlideProps {
  item: Banner;
}

/**
 * Renders a single banner slide. Falls back to solid colour when imageUrl is absent.
 */
function BannerSlide({ item }: BannerSlideProps): React.JSX.Element {
  return (
    <View style={[styles.slide, { backgroundColor: item.color }]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.slideImage}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.slideOverlay}>
        <Text style={styles.slideTitle} numberOfLines={2}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.slideSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

interface DotsProps {
  count: number;
  activeIndex: number;
}

/**
 * Renders pagination dots below the banner carousel.
 */
function Dots({ count, activeIndex }: DotsProps): React.JSX.Element {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface HomeBannerCarouselProps {
  banners: Banner[];
}

/**
 * Horizontally paged carousel that auto-advances every 4 seconds.
 * Loops back to the first item after the last slide.
 */
export default function HomeBannerCarousel({ banners }: HomeBannerCarouselProps): React.JSX.Element | null {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const listRef = useRef<FlatList<Banner>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        activeIndexRef.current = viewableItems[0].index;
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  /** Advances to the next slide using the ref — stable across re-renders. */
  const scrollToNext = useCallback(() => {
    if (banners.length < 2) return;
    const next = (activeIndexRef.current + 1) % banners.length;
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [banners.length]);

  useEffect(() => {
    if (banners.length < 2) return;
    timerRef.current = setInterval(scrollToNext, AUTO_SCROLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scrollToNext, banners.length]);

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BannerSlide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      {banners.length > 1 && <Dots count={banners.length} activeIndex={activeIndex} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
  },
  slideOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: THEME.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  slideTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.surface,
  },
  slideSubtitle: {
    fontSize: THEME.typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME.spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: THEME.colors.primary,
    width: 18,
    borderRadius: 3,
  },
  dotInactive: {
    backgroundColor: THEME.colors.border,
  },
});
