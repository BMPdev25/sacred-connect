import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { APP_COLORS } from '../../../constants/Colors';
import { useSocket } from '../../../context/SocketContext';
import devoteeService from '../../../services/devoteeService';

export default function InstantSearchScreen() {
  const { pujaId, ceremonyType, latitude, longitude, address, city } = useLocalSearchParams();
  const router = useRouter();
  const { socket } = useSocket();
  
  const [status, setStatus] = useState<'searching' | 'matched' | 'no_match' | 'expired'>('searching');
  const [matchedBooking, setMatchedBooking] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Start rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Initiate the booking
    initiateInstantBooking();

    // Listen for match
    if (socket) {
      socket.on('instant_booking_accepted', (data) => {
        console.log('Match found!', data);
        setMatchedBooking(data);
        setStatus('matched');
      });
    }

    // Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (socket) {
        socket.off('instant_booking_accepted');
      }
    };
  }, []);

  const initiateInstantBooking = async () => {
    try {
      const response = await devoteeService.bookInstantCeremony({
        ceremonyType,
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        address,
        city,
      });
      console.log('Booking initiated:', response._id);
    } catch (error: any) {
      console.error('Failed to initiate instant booking:', error);
      if (error.includes('No priests available')) {
        setStatus('no_match');
      } else {
        Alert.alert('Error', error);
        router.back();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderContent = () => {
    switch (status) {
      case 'searching':
        return (
          <View style={styles.content}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.innerCircle}>
                <MaterialCommunityIcons name="home-search" size={60} color={APP_COLORS.primary} />
              </View>
            </Animated.View>
            
            <Text style={styles.title}>Searching for Priest</Text>
            <Text style={styles.subtitle}>Finding the best verified priest near you for {ceremonyType}</Text>
            
            <View style={styles.timerContainer}>
              <Ionicons name="timer-outline" size={20} color={APP_COLORS.gray} />
              <Text style={styles.timerText}>Wait time: {formatTime(timeLeft)}</Text>
            </View>
            
            <ActivityIndicator size="large" color={APP_COLORS.primary} style={styles.loader} />
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel Search</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'matched':
        return (
          <View style={styles.content}>
            <View style={[styles.successCircle]}>
              <Ionicons name="checkmark-circle" size={100} color={APP_COLORS.success} />
            </View>
            
            <Text style={styles.title}>Match Found!</Text>
            <Text style={styles.subtitle}>A verified priest is ready for your ceremony.</Text>
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.replace({
                pathname: '/(devoteeScreens)/(bookings)/BookingDetails',
                params: { bookingId: matchedBooking.bookingId }
              })}
            >
              <Text style={styles.primaryButtonText}>View Booking Details</Text>
            </TouchableOpacity>
          </View>
        );

      case 'no_match':
        return (
          <View style={styles.content}>
            <Ionicons name="location-outline" size={80} color={APP_COLORS.gray} />
            <Text style={styles.title}>No Priests Nearby</Text>
            <Text style={styles.subtitle}>Currently, there are no available priests within your area for an instant booking.</Text>
            
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Go Back & Schedule Later</Text>
            </TouchableOpacity>
          </View>
        );

      case 'expired':
        return (
          <View style={styles.content}>
            <Ionicons name="time" size={80} color={APP_COLORS.gray} />
            <Text style={styles.title}>Request Expired</Text>
            <Text style={styles.subtitle}>Our priests are currently busy. Please try again or schedule for a later time.</Text>
            
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    width: Platform.OS === 'web' ? '100%' : undefined,
    maxWidth: Platform.OS === 'web' ? 500 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  content: {
    padding: 30,
    alignItems: 'center',
    width: '100%',
  },
  pulseCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: APP_COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: APP_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  successCircle: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: APP_COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    marginLeft: 8,
    fontSize: 16,
    color: APP_COLORS.gray,
    fontWeight: '500',
  },
  loader: {
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    padding: 15,
  },
  cancelButtonText: {
    color: APP_COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: APP_COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
