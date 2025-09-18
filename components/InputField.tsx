import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../constants/Colors';

const APP_COLORS = {
  ...{
    background: Colors.light.background,
    primary: Colors.light.tint,
    white: Colors.light.background,
    gray: '#6b6b6b',
    lightGray: '#eee',
    black: Colors.light.text,
    error: '#cc0000',
  },
};

type Props = TextInputProps & {
  label?: string;
  showTogglePassword?: boolean;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
  error?: string;
};

export default function InputField({
  label,
  showTogglePassword = false,
  passwordVisible = false,
  onTogglePassword,
  error,
  ...props
}: Props) {
  return (
    <View style={styles.inputContainer}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            showTogglePassword && styles.passwordInput,
            error && styles.inputError,
          ]}
          {...props}
        />

        {showTogglePassword && (
          <TouchableOpacity style={styles.passwordToggle} onPress={onTogglePassword}>
            <Ionicons name={passwordVisible ? 'eye-outline' : 'eye-off-outline'} size={24} color={APP_COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: APP_COLORS.black,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: APP_COLORS.black,
  },
  passwordInput: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: APP_COLORS.error,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: APP_COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
