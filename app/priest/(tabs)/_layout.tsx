import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import PriestTabBar from '@/components/shared/PriestTabBar';
import { RootState } from '@/redux/store';
import { hasPriestCompletedOnboarding } from '@/utils/priestUtils';

export default function PriestTabsLayout() {
  const router = useRouter();
  const priestState = useSelector((state: RootState) => state.user.priestState);

  useEffect(() => {
    if (!priestState) return;

    const completed = hasPriestCompletedOnboarding(
      priestState.onboardingCompleted,
      priestState.verificationStatus
    );

    if (!completed) {
      router.replace('/priest/onboarding' as any);
      return;
    }

    if ((priestState.verificationStatus as string) !== 'approved' && priestState.verificationStatus !== 'verified') {
      router.replace('/priest/onboarding/verification-status' as any);
    }
  }, [priestState, router]);

  return (
    <Tabs
      tabBar={(props) => <PriestTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="HomeTab" options={{ title: 'Home' }} />
      <Tabs.Screen name="RequestsTab" options={{ title: 'Requests' }} />
      <Tabs.Screen name="CalendarTab" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="EarningsTab" options={{ title: 'Earnings' }} />
      <Tabs.Screen name="ProfileTab" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
