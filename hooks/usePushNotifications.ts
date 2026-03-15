import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

  if (!isExpoGoAndroid) {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldShowAlert: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();

  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.EventSubscription>(null as any);
  const responseListener = useRef<Notifications.EventSubscription>(null as any);

  async function registerForPushNotificationsAsync() {
    if (isExpoGoAndroid) {
      console.warn(
        'Push notifications are not supported in Expo Go on Android for SDK 54. Please use a development build.'
      );
      return;
    }

    const Notifications = require('expo-notifications');

    let token;
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Get project ID
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      console.log('Push token:', token);
    } else {
      if (Constants.appOwnership !== 'expo') {
        console.log('Must use physical device for Push Notifications');
      }
    }

    if (Platform.OS === 'android') {
      const Notifications = require('expo-notifications');
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  useEffect(() => {
    if (isExpoGoAndroid) return;

    const Notifications = require('expo-notifications');

    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification: any) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log('Notification Response:', response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
