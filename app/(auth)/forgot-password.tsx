import React, { useState, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import {
  ForgotPasswordHeader,
  StateAForm,
  StateBSuccess,
} from '@/components/auth/forgot-password.components';
import { handleSendReset } from '@/handlers/auth/forgot-password.handlers';

/**
 * ForgotPasswordScreen — email recovery flow.
 * Implements a parallel crossfade animation to transition into success state.
 */
export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Anim values for crossfade transition
  const stateAOpacity = useRef(new Animated.Value(1)).current;
  const stateBOpacity = useRef(new Animated.Value(0)).current;

  /** Triggers the crossfade animation when email send succeeds. */
  const triggerCrossfade = (): void => {
    Animated.parallel([
      Animated.timing(stateAOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(stateBOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /** Form submit handler. */
  const onSubmit = (): void => {
    handleSendReset(email, setIsSuccess, setError, setLoading, triggerCrossfade);
  };

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + THEME.spacing.lg, paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={80}
      >
        <ForgotPasswordHeader router={router} />

        {/* State A Wrapper */}
        <Animated.View
          style={[styles.container, { opacity: stateAOpacity }]}
          pointerEvents={isSuccess ? 'none' : 'auto'}
        >
          <StateAForm
            email={email}
            onEmailChange={setEmail}
            onSubmit={onSubmit}
            loading={loading}
            error={error}
          />
        </Animated.View>

        {/* State B Wrapper */}
        <Animated.View
          style={[styles.container, styles.absoluteContainer, { opacity: stateBOpacity }]}
          pointerEvents={isSuccess ? 'auto' : 'none'}
        >
          <StateBSuccess email={email} router={router} />
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  container: {
    flex: 1,
  },
  absoluteContainer: {
    position: 'absolute',
    top: 72, // Aligns offset below header
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
    bottom: 0,
  },
});
