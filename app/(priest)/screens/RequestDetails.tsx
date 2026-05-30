import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import { styles } from './RequestDetails.styles';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { PriestRequestsService } from '@/services/priest/priestRequestsService';
import { decrementPendingRequests } from '@/redux/slices/priestDashboardSlice';
import { formatRequestExpiry } from '@/utils/priestUtils';
import {
  RequestDevoteeCard,
  RequestCeremonyCard,
  RequestEarningsCard,
  RequestDetailsSkeleton,
} from '@/components/priest/RequestDetailsComponents';

/**
 * RequestDetails Screen.
 * Displays details of a booking request to a priest, allowing acceptance or declination.
 */
export default function RequestDetails(): React.JSX.Element {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [isProcessing, setIsProcessing] = useState(false);

  const { data: request, isLoading, isError, refetch } = useQuery({
    queryKey: ['requestDetail', bookingId],
    queryFn: () => PriestRequestsService.fetchRequestDetail(bookingId!),
    staleTime: 0,
    enabled: !!bookingId,
  });

  const handleAccept = async () => {
    if (!bookingId) return;
    setIsProcessing(true);
    try {
      await PriestRequestsService.acceptRequest(bookingId);
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['priestTodayBookings'] });
      queryClient.invalidateQueries({ queryKey: ['priestCalendarBookings'] });
      queryClient.invalidateQueries({ queryKey: ['priestEarnings'] });
      dispatch(decrementPendingRequests());
      router.back();
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('no longer available')) {
        Alert.alert('Too Late', 'This request was already taken or expired.');
        router.back();
      } else {
        Alert.alert('Error', error.message || 'Failed to accept booking');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDecline = async () => {
    if (!bookingId) return;
    setIsProcessing(true);
    try {
      await PriestRequestsService.declineRequest(bookingId);
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
      dispatch(decrementPendingRequests());
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Request',
      "The devotee will be notified that you're unavailable.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: confirmDecline },
      ]
    );
  };

  if (isError) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 8 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
        </TouchableOpacity>
        <View style={[styles.centerAlign, { flex: 1, paddingTop: insets.top + 56, paddingHorizontal: 24 }]}>
          <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.error} />
          <Text style={styles.errorText}>Failed to load request details.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading || !request) {
    return <RequestDetailsSkeleton onBack={() => router.back()} topInset={insets.top} />;
  }

  const expiryText = formatRequestExpiry(request.createdAt);
  const isExpired = expiryText === 'Expired';
  const buttonsDisabled = isProcessing || isExpired;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 56, paddingBottom: 20 }]}
      >
        <Text style={styles.screenTitle}>Booking Request</Text>
        <RequestDevoteeCard devotee={request.devoteeId} />
        <RequestCeremonyCard
          ceremonyType={request.ceremonyType}
          date={request.date}
          startTime={request.startTime}
          endTime={request.endTime}
          durationMinutes={request.durationMinutes || 0}
          address={request.location?.address || ''}
          distance={request.distance}
        />
        <RequestEarningsCard
          basePrice={request.basePrice || 0}
          durationMinutes={request.durationMinutes || 0}
        />
      </ScrollView>

      {/* ACTION SECTION */}
      <View style={[styles.actionSection, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton
          title="Accept Booking"
          onPress={handleAccept}
          loading={isProcessing}
          disabled={buttonsDisabled}
          style={{ marginBottom: 12 }}
        />
        
        <TouchableOpacity
          style={[styles.declineButton, buttonsDisabled && { opacity: 0.5 }]}
          onPress={handleDecline}
          disabled={buttonsDisabled}
        >
          <Text style={styles.declineButtonText}>Decline Request</Text>
        </TouchableOpacity>

        <Text style={[styles.expiryText, isExpired && styles.expiredErrorText]}>
          {isExpired ? 'This request has expired' : expiryText}
        </Text>
      </View>
    </View>
  );
}


