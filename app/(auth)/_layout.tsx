import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

export default function AuthLayout() {
  const user = useSelector((state: any) => state.auth.user);
  const userRole = useSelector((state: any) => state.auth.userRole);

  const userInfo = useSelector((state: RootState) => state.auth.userInfo);
  
  // If user is already authenticated, redirect to their role-specific home
  if (userInfo?.token) {
    if (userInfo.userType === 'devotee') {
      return <Redirect href={'/(devotee)/home' as any} />;
    } else if (userInfo.userType === 'priest') {
      return <Redirect href={'/(priest)/home' as any} />;
    }
  }

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
          headerShown: false,
        }}
      />
    </Stack>
  );
}