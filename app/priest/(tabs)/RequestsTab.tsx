import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import RequestCard from '@/components/priest/RequestCard';
import { PriestRequestsService } from '@/services/priest/priestRequestsService';
import { SocketManager } from '@/services/priest/socketManager';
import { RootState } from '@/redux/store';
import { setPendingRequestsCount, decrementPendingRequests } from '@/redux/slices/priestDashboardSlice';
import { BookingRequest } from '@/types/priest.dashboard.types';

export default function RequestsTab(): React.JSX.Element {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const isAnyProcessing = processingId !== null;
  
  const { currentStatus } = useSelector((state: RootState) => state.priestDashboard);

  // Data fetching
  const { data: requests = [], isLoading } = useQuery<BookingRequest[]>({
    queryKey: ['priestPendingRequests'],
    queryFn: PriestRequestsService.fetchPendingRequests,
    staleTime: 0,
    refetchInterval: 30 * 1000,
  });

  // Sync count to Redux when it changes
  useEffect(() => {
    dispatch(setPendingRequestsCount(requests.length));
  }, [requests.length, dispatch]);

  // Real-time socket integration
  useEffect(() => {
    const handleNewRequest = () => {
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
    };

    SocketManager.onNewBookingRequest(handleNewRequest);
    
    return () => {
      SocketManager.offNewBookingRequest(handleNewRequest);
    };
  }, [queryClient]);

  const handleAccept = async (requestId: string) => {
    if (processingId !== null) return;
    setProcessingId(requestId);
    try {
      await PriestRequestsService.acceptRequest(requestId);
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['priestTodayBookings'] });
      queryClient.invalidateQueries({ queryKey: ['priestCalendarBookings'] });
      queryClient.invalidateQueries({ queryKey: ['priestEarnings'] });
      dispatch(decrementPendingRequests());
      // Optional: Success toast
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept booking');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDecline = async (requestId: string) => {
    if (processingId !== null) return;
    setProcessingId(requestId);
    try {
      await PriestRequestsService.declineRequest(requestId);
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
      dispatch(decrementPendingRequests());
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = (requestId: string) => {
    if (processingId !== null) return;
    Alert.alert(
      'Decline Request?',
      'The devotee will be notified.',
      [
        { text: 'Keep Request', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: () => confirmDecline(requestId) 
        }
      ]
    );
  };

  const handleViewDetails = (requestId: string) => {
    router.push({
      pathname: '/(priest)/screens/RequestDetails' as any,
      params: { bookingId: requestId }
    });
  };

  // Render Helpers
  const renderEmptyState = () => {
    if (isLoading) return null; // Wait for loading to finish

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="albums-outline" size={56} color={THEME.colors.textMuted} />
        <Text style={styles.emptyHeading}>No pending requests</Text>
        
        {currentStatus === 'offline' ? (
          <>
            <Text style={styles.emptySubheading}>You're currently offline</Text>
            <View style={{ marginTop: THEME.spacing.md, width: '100%' }}>
              <PrimaryButton 
                title="Go Online"
                variant="outline"
                onPress={() => router.push('/priest/(tabs)/HomeTab' as any)}
              />
            </View>
          </>
        ) : (
          <Text style={styles.emptySubheading}>New requests will appear here</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Requests</Text>
        {requests.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {requests.length} request{requests.length > 1 ? 's' : ''} waiting
          </Text>
        )}
      </View>

      {requests.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <RequestCard
              request={item}
              isNewest={index === 0}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onPress={handleViewDetails}
              isProcessing={processingId === item._id}
              isDisabled={isAnyProcessing && processingId !== item._id}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background common for list screens
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 24, // displayMedium
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyHeading: {
    fontSize: THEME.typography.heading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.md,
    textAlign: 'center',
  },
  emptySubheading: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
});
