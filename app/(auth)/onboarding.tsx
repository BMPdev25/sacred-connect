/**
 * Onboarding screen — three-slide horizontal pager shown on first launch.
 * Guides new users through the app's value proposition before routing
 * them to role selection.
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ImageSourcePropType,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';

// ---------------------------------------------------------------------------
// Slide data types and content
// ---------------------------------------------------------------------------

/** Shape of a single onboarding slide. */
type OnboardingSlide = {
  /** Unique identifier for FlatList keying. */
  id: string;
  /** AssetService image key to load slide illustration. */
  imageKey: string;
  /** Large headline text shown in the content card. */
  headline: string;
  /** Supporting description beneath the headline. */
  subtext: string;
  /** Whether this slide shows the primary 'Get Started' CTA. */
  showGetStarted: boolean;
};

const slides: OnboardingSlide[] = [
  {
    id: '1',
    imageKey: 'auth.onboarding1',
    headline: 'Connect with Divine Blessings',
    subtext: 'Book authentic spiritual services and rituals from trusted experts',
    showGetStarted: false,
  },
  {
    id: '2',
    imageKey: 'auth.onboarding2',
    headline: 'Personalized Rituals for Every Need',
    subtext: 'From pujas to homams, find the right ritual for peace and prosperity',
    showGetStarted: false,
  },
  {
    id: '3',
    imageKey: 'auth.onboarding3',
    headline: 'Are You a Pandit?',
    subtext: 'Join our verified network. Reach more devotees and grow your earnings.',
    showGetStarted: true,
  },
];

// ---------------------------------------------------------------------------
// Sub-component: single slide
// ---------------------------------------------------------------------------

/** Props for one onboarding slide. */
interface OnboardingSlideItemProps {
  /** The slide data to render. */
  slide: OnboardingSlide;
  /** Screen width used to size each slide precisely. */
  width: number;
}

/**
 * Renders one paginated slide: full-width image on top, rounded content
 * card overlapping at the bottom.
 */
function OnboardingSlideItem({ slide, width }: OnboardingSlideItemProps): React.ReactElement {
  return (
    <View style={[styles.slide, { width }]}>
      <Image
        source={AssetService.getImage(slide.imageKey) as ImageSourcePropType}
        style={[styles.slideImage, { width }]}
        resizeMode="cover"
        accessibilityLabel={slide.headline}
      />
      <View style={styles.contentCard}>
        {/* Saffron accent bar */}
        <View style={styles.accentBar}>
          <View style={styles.accentDot} />
        </View>
        <Text style={styles.headline}>{slide.headline}</Text>
        <Text style={styles.subtext}>{slide.subtext}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: progress dots
// ---------------------------------------------------------------------------

/** Props for the animated progress dots. */
interface ProgressDotsProps {
  /** Zero-based index of the currently visible slide. */
  currentIndex: number;
  /** Total number of slides. */
  total: number;
}

/**
 * Animated dot indicators showing current slide position.
 * Active dot expands in width; inactive dots remain small circles.
 */
function ProgressDots({ currentIndex, total }: ProgressDotsProps): React.ReactElement {
  const animValues = useRef(
    Array.from({ length: total }, (_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  // Animate widths whenever currentIndex changes
  React.useEffect(() => {
    animValues.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === currentIndex ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
  }, [currentIndex, animValues]);

  return (
    <View style={styles.dotsRow}>
      {animValues.map((anim, i) => {
        const dotWidth = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [DOT_INACTIVE_SIZE, DOT_ACTIVE_WIDTH],
        });
        const dotColor = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [THEME.colors.border, THEME.colors.primary],
        });
        return (
          <Animated.View
            key={i}
            style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Hook: slide navigation
// ---------------------------------------------------------------------------

/** Return shape for useSlideNavigation. */
interface SlideNavigation {
  /** Zero-based index of the currently visible slide. */
  currentIndex: number;
  /** Advances to the next slide by programmatically scrolling the FlatList. */
  handleNext: () => void;
  /** Skips to the role-selection screen immediately. */
  handleSkip: () => void;
  /** Called on FlatList momentum scroll end to update currentIndex. */
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * Manages slide index state and programmatic FlatList navigation.
 *
 * @param flatListRef - Ref to the FlatList for imperative scrolling.
 * @param slideCount - Number of slides for bounds checking.
 * @returns Navigation state and handlers.
 */
function useSlideNavigation(
  flatListRef: React.RefObject<FlatList<OnboardingSlide>>,
  slideCount: number
): SlideNavigation {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  function handleNext(): void {
    const nextIndex = currentIndex + 1;
    if (nextIndex < slideCount) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  }

  function handleSkip(): void {
    router.replace('/role-selection');
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    const offsetX = event.nativeEvent.contentOffset.x;
    const width = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  }

  return { currentIndex, handleNext, handleSkip, handleScroll };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOT_ACTIVE_WIDTH = 20;
const DOT_INACTIVE_SIZE = 8;
const DOT_GAP = 6;
const SKIP_TOP = 16;
const SKIP_RIGHT = 24;
const IMAGE_HEIGHT_RATIO = 0.65;
const CONTENT_OVERLAP = 16;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * OnboardingScreen — horizontal paginated slides shown on first launch.
 * Introduces the app's value, then routes to role-selection on completion.
 */
export default function OnboardingScreen(): React.ReactElement {
  const { width, height } = useWindowDimensions();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const { currentIndex, handleNext, handleSkip, handleScroll } = useSlideNavigation(
    flatListRef,
    slides.length
  );
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isLastSlide = currentIndex === slides.length - 1;

  function renderSlide({ item }: ListRenderItemInfo<OnboardingSlide>): React.ReactElement {
    return <OnboardingSlideItem slide={item} width={width} />;
  }

  return (
    <View style={styles.screen}>
      {/* Skip button — hidden on last slide */}
      {!isLastSlide && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: insets.top + SKIP_TOP }]}
          onPress={handleSkip}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide pager */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        style={styles.flatList}
      />

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <ProgressDots currentIndex={currentIndex} total={slides.length} />

        {isLastSlide ? (
          <View style={styles.getStartedWrap}>
            <PrimaryButton
              title="Get Started"
              onPress={() => router.replace('/role-selection')}
              variant="primary"
            />
          </View>
        ) : (
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  slideImage: {
    height: '65%' as unknown as number,
  },
  contentCard: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    marginTop: -CONTENT_OVERLAP,
    paddingHorizontal: THEME.spacing.xl,
    paddingTop: THEME.spacing.lg,
    alignItems: 'center',
  },
  accentBar: {
    width: 40,
    height: 3,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  accentDot: {
    width: THEME.spacing.xs,
    height: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.surface,
  },
  headline: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    lineHeight: THEME.typography.displayMedium * 1.25,
  },
  subtext: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
    lineHeight: THEME.typography.body * 1.6,
  },
  bottomBar: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
    paddingTop: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    gap: THEME.spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOT_GAP,
  },
  dot: {
    height: DOT_INACTIVE_SIZE,
    borderRadius: THEME.borderRadius.pill,
  },
  nextBtn: {
    alignSelf: 'flex-end',
  },
  nextText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  getStartedWrap: {
    width: '100%',
  },
  skipBtn: {
    position: 'absolute',
    right: SKIP_RIGHT,
    zIndex: 10,
  },
  skipText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
});
