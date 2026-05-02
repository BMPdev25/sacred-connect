import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, Dimensions, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

// 3D/Cinematic Particle System with Parallax-like depth
const PARTICLES = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  x: Math.random(),
  y: Math.random(),
  size: Math.random() * 8 + 3,
  delay: Math.random() * 2000,
  duration: Math.random() * 3000 + 3000,
  depth: Math.random() // Used for parallax speed (0 = far, 1 = near)
}));

function CinematicParticle({ x, y, size, delay, duration, depth }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: depth * 0.6 + 0.2, duration: duration * 0.4, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -50 * (depth + 0.5), duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.2, duration: duration * 0.5, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.6, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.5, duration: duration * 0.5, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * width,
        top: y * height,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFE8C4',
        opacity,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

export default function Index() {
  const [nextRoute, setNextRoute] = React.useState<string | null>(null);

  // Core Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(30)).current;
  
  // 3D "Floating" effect for logo
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Background rotation effect
  const bgRotation = useRef(new Animated.Value(0)).current;

  // Text reveal
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const letterSpacing = useRef(new Animated.Value(10)).current;

  // Tagline
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Initial Cinematic Pop-In
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Letter spacing animation requires useNativeDriver: false or treating it differently, 
        // we'll stick to transforms for native driver performance where possible, 
        // but we'll use a subtle scale instead for the "expanding" feel to keep it 60fps
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();

    // 2. Continuous 3D Floating Effect (Breathing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();

    // 3. Slow Background Rotation (Light rays effect)
    Animated.loop(
      Animated.timing(bgRotation, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(() => setNextRoute('/(auth)/'), 4500);
    return () => clearTimeout(timer);
  }, []);

  const spin = bgRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15]
  });

  return (
    <View style={styles.container}>
      {nextRoute ? <Redirect href={nextRoute as any} /> : null}
      <ExpoStatusBar style="light" />

      {/* Deep Cinematic Gradient Background (Lightened) */}
      <LinearGradient
        colors={['#611F05', '#A33B0A', '#E87A30']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Rotating Background "Rays" (Cinematic lighting) */}
      <Animated.View style={[styles.lightRaysContainer, { transform: [{ rotate: spin }] }]}>
        <LinearGradient
          colors={['rgba(255,160,50,0.15)', 'transparent']}
          style={styles.ray1}
        />
        <LinearGradient
          colors={['rgba(255,160,50,0.15)', 'transparent']}
          style={styles.ray2}
        />
      </Animated.View>

      {/* Cinematic Particles */}
      {PARTICLES.map((p) => <CinematicParticle key={p.id} {...p} />)}

      {/* Main Content */}
      <View style={styles.contentContainer}>
        
        {/* Logo with 3D Float */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: Animated.add(logoTranslateY, floatY) }
              ]
            }
          ]}
        >
          
          <Image
            source={require('../logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Reveal */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: 'center',
            marginTop: -15 // Reduced gap to account for transparent padding in logo
          }}
        >
          <Text style={styles.appName}>BookMyPujari</Text>
          
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            Divine Rituals, Delivered with Grace
          </Animated.Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0800',
    overflow: 'hidden',
  },
  lightRaysContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  ray1: {
    position: 'absolute',
    width: width * 2,
    height: 100,
    transform: [{ rotate: '45deg' }],
  },
  ray2: {
    position: 'absolute',
    width: width * 2,
    height: 100,
    transform: [{ rotate: '-45deg' }],
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 260,
    height: 260,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'serif',
    color: '#FFE8C4', // Soft gold
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 160, 50, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#FFE8C4', // Lightened slightly to match title for better contrast
    fontStyle: 'italic',
    fontFamily: 'serif',
    marginTop: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  }
});
