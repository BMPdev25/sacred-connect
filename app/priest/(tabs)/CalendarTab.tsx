import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import { CalendarBooking } from '@/types/priest.calendar.types';
import { CalendarService } from '@/services/priest/calendarService';
import CalendarDayBookingCard from '@/components/priest/CalendarDayBookingCard';

/**
 * Returns today's date formatted as a local timezone YYYY-MM-DD string.
 *
 * @returns Today's date string.
 */
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a given date string into a friendly localized display label.
 *
 * @param dateStr - The date string in "YYYY-MM-DD" format.
 * @returns Human-friendly label (e.g. "Today", "Tomorrow", "Wed, 3 June").
 */
function formatSelectedDateLabel(dateStr: string): string {
  try {
    const today = getTodayString();
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomorrow = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';

    const [year, monthStr, dayStr] = dateStr.split('-');
    const date = new Date(Number(year), Number(monthStr) - 1, Number(dayStr));
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

/**
 * Renders a loading card placeholder block.
 */
function SkeletonCard(): React.JSX.Element {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonTimePill} />
        <View style={styles.skeletonStatusPill} />
      </View>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
    </View>
  );
}

/**
 * Calendar tab main component for the priest workspace dashboard.
 */
export default function CalendarTab(): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const { data: allBookings = [], isLoading } = useQuery<CalendarBooking[]>({
    queryKey: ['priestCalendarBookings'],
    queryFn: CalendarService.fetchCalendarBookings,
    staleTime: 120000,
  });

  const markedDates = useMemo(() => {
    return CalendarService.buildMarkedDates(allBookings, selectedDate);
  }, [allBookings, selectedDate]);

  const bookingsForSelectedDate = useMemo(() => {
    return allBookings
      .filter((b) => b.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allBookings, selectedDate]);

  const selectedDateLabel = useMemo(() => {
    return formatSelectedDateLabel(selectedDate);
  }, [selectedDate]);

  const handleBookingPress = (bookingId: string) => {
    router.push({
      pathname: '/(priest)/screens/PriestBookingDetails',
      params: { bookingId },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>My Calendar</Text>

      <Calendar
        current={selectedDate}
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          selectedDayBackgroundColor: THEME.colors.primary,
          todayTextColor: THEME.colors.primary,
          todayBackgroundColor: 'transparent',
          todayBorderColor: THEME.colors.primary,
          arrowColor: THEME.colors.primary,
          monthTextColor: THEME.colors.textPrimary,
          textMonthFontWeight: '700',
          dotColor: THEME.colors.primary,
          selectedDotColor: 'white',
          textDayFontSize: 14,
          textMonthFontSize: 16,
        } as any}
      />

      <View style={styles.divider} />

      <View style={styles.bookingsContainer}>
        <Text style={styles.sectionHeading}>Bookings for {selectedDateLabel}</Text>

        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : bookingsForSelectedDate.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color={THEME.colors.textMuted} />
            <Text style={styles.emptyText}>No bookings on this day</Text>
          </View>
        ) : (
          bookingsForSelectedDate.map((booking) => (
            <CalendarDayBookingCard
              key={booking._id}
              booking={booking}
              onPress={() => handleBookingPress(booking._id)}
            />
          ))
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: THEME.spacing.lg,
  },
  headerTitle: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: THEME.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 8,
  },
  bookingsContainer: {
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  emptyText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
  },
  skeletonContainer: {
    gap: 10,
  },
  skeletonCard: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 14,
    height: 100,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonTimePill: {
    backgroundColor: '#E7E5E4',
    width: 80,
    height: 20,
    borderRadius: THEME.borderRadius.pill,
  },
  skeletonStatusPill: {
    backgroundColor: '#E7E5E4',
    width: 70,
    height: 20,
    borderRadius: THEME.borderRadius.pill,
  },
  skeletonTitle: {
    backgroundColor: '#E7E5E4',
    width: '60%',
    height: 18,
    borderRadius: 4,
    marginTop: 10,
  },
  skeletonSubtitle: {
    backgroundColor: '#E7E5E4',
    width: '40%',
    height: 14,
    borderRadius: 4,
    marginTop: 4,
  },
});
