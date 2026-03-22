import type * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

/**
 * Utility to schedule a local notification for an upcoming puja
 * @param bookingId The ID of the booking
 * @param ceremonyName Name of the ceremony
 * @param date The date of the puja (ISO string)
 * @param startTime The start time of the puja (HH:mm)
 * @param minutesBefore How many minutes before the start time to notify
 */
export async function schedulePujaReminder(
  bookingId: string,
  ceremonyName: string,
  date: string,
  startTime: string,
  minutesBefore: number = 120 // Default 2 hours
) {
  try {
    const targetDate = new Date(date);
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    }
    
    const triggerDate = new Date(targetDate.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();
    
    if (triggerDate <= now) {
      console.log('PujaReminder: Reminder time is in the past, skipping scheduling.');
      return null;
    }
    
    if (isExpoGoAndroid) {
      console.log('PujaReminder: Notifications and scheduling are disabled in Expo Go Android SDK 53. Use dev build.');
      return null;
    }

    const Notifications = require('expo-notifications');
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Puja Reminder 🕉️',
        body: `Your ${ceremonyName} starts in ${minutesBefore / 60} hours at ${startTime}.`,
        data: { bookingId, type: 'PUJA_REMINDER' },
        sound: true,
      },
      trigger: triggerDate as any,
    });
    
    console.log(`PujaReminder: Scheduled for ${ceremonyName} at ${triggerDate.toLocaleString()}, ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('PujaReminder: Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a specific scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string) {
  if (isExpoGoAndroid) return;
  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('PujaReminder: Error cancelling notification:', error);
  }
}

/**
 * Request permissions for local notifications (if not already handled)
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web' || isExpoGoAndroid) return false;
  
  const Notifications = require('expo-notifications');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}
