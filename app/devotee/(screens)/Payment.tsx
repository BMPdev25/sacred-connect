import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';

import { RootState } from '@/redux/store';
import { setCreatedBooking } from '@/redux/slices/bookingSlice';
import * as bookingService from '@/services/devotee/bookingService';
import { THEME } from '@/constants/theme';
import { formatBookingReference } from '@/utils/bookingUtils';
import { AssetService } from '@/services/assets/AssetService';

import ProcessingView from '@/components/devotee/payment/ProcessingView';
import FailedView from '@/components/devotee/payment/FailedView';
import TimeoutView from '@/components/devotee/payment/TimeoutView';
import { useBookingPolling } from '@/components/devotee/payment/useBookingPolling';

export default function PaymentScreen(): React.ReactElement {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{
    bookingId: string;
    razorpayOrderId: string;
    amount: string; // in paise
    totalDisplay: string; // display amount in rupees
  }>();

  const user = useSelector((state: RootState) => state.user);
  const draft = useSelector((state: RootState) => state.booking);
  
  const [screenState, setScreenState] = useState<'initiating' | 'processing' | 'failed' | 'timeout'>('initiating');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasTimedOutTotal, setHasTimedOutTotal] = useState(false);

  const timeout12sRef = useRef<any>(null);
  const timeout60sRef = useRef<any>(null);

  const isPollingActive = (screenState === 'timeout' || screenState === 'processing') && !hasTimedOutTotal;

  useBookingPolling(params.bookingId, isPollingActive);

  const handleVerifyPayment = async (paymentData: any) => {
    try {
      const booking = await bookingService.verifyPayment({
        bookingId: params.bookingId || '',
        rzpPaymentId: paymentData.razorpay_payment_id,
        rzpOrderId: paymentData.razorpay_order_id,
        rzpSignature: paymentData.razorpay_signature,
      });

      clearTimeout(timeout12sRef.current);
      clearTimeout(timeout60sRef.current);

      const reference = formatBookingReference(
        booking.paymentDetails?.receiptNumber,
        booking._id,
        booking.date
      );
      dispatch(setCreatedBooking({
        bookingId: booking._id,
        razorpayOrderId: paymentData.razorpay_order_id,
        bookingReference: reference,
      }));
      router.replace('/devotee/BookingConfirmation' as any);
    } catch (error: any) {
      setErrorMessage(
        'Payment was received but verification failed. ' +
        'If amount was deducted, contact support@sacredconnect.in'
      );
      setScreenState('failed');
    }
  };

  const launchRazorpay = async () => {
    const options = {
      description: 'Sacred Connect Ceremony Booking',
      image: 'https://sacredconnect.in/logo.png',
      key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: params.amount,
      currency: 'INR',
      name: 'Sacred Connect',
      order_id: params.razorpayOrderId,
      prefill: {
        email: user.email || '',
        contact: user.phone || '',
        name: user.name || 'Devotee',
      },
      theme: { color: THEME.colors.primary }
    };

    try {
      const paymentData = await RazorpayCheckout.open(options);
      setScreenState('processing');
      
      timeout12sRef.current = setTimeout(() => {
        setScreenState('timeout');
      }, 12000);

      timeout60sRef.current = setTimeout(() => {
        setHasTimedOutTotal(true);
        setErrorMessage('Verification timed out. Please contact support.');
        setScreenState('failed');
      }, 60000);

      await handleVerifyPayment(paymentData);

    } catch (error: any) {
      if (error && (error.code === 2 || error.description === 'Payment Cancelled' || error.message?.includes('cancelled'))) {
        router.back();
      } else {
        setErrorMessage(error.description || error.message || 'Payment initiation failed');
        setScreenState('failed');
      }
    }
  };

  useEffect(() => {
    launchRazorpay();
    return () => {
      clearTimeout(timeout12sRef.current);
      clearTimeout(timeout60sRef.current);
    };
  }, []);

  const handleRetryPayment = async () => {
    setIsRetrying(true);
    try {
      const order = await bookingService.createPaymentOrder(params.bookingId || '', draft.pricing?.totalAmount || 0);
      dispatch(setCreatedBooking({
        bookingId: params.bookingId || '',
        razorpayOrderId: order.id,
        bookingReference: formatBookingReference(order.receipt || order.id, params.bookingId || '', draft.selectedDate || ''),
      }));
      router.setParams({
        razorpayOrderId: order.id,
        amount: order.amount.toString(),
      });
      setScreenState('initiating');
      setHasTimedOutTotal(false);
      setErrorMessage('');
      setTimeout(() => launchRazorpay(), 100);
    } catch (err: any) {
      Alert.alert('Retry Failed', err.message || 'Could not recreate order');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancelPayment = () => {
    router.replace('/devotee/(tabs)/HomeTab' as any);
  };

  return (
    <View style={styles.container}>
      {screenState === 'failed' && (
        <FailedView
          errorMessage={errorMessage}
          isRetrying={isRetrying}
          onTryAgain={handleRetryPayment}
          onGoBack={handleCancelPayment}
        />
      )}
      {(screenState === 'initiating' || screenState === 'processing') && (
        <ProcessingView state={screenState} totalDisplay={params.totalDisplay || '0'} />
      )}
      {screenState === 'timeout' && (
        <TimeoutView
          hasTimedOutTotal={hasTimedOutTotal}
          onGoHome={handleCancelPayment}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
});
