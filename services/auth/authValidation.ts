import { SignupDevoteePayload, SignupPriestPayload } from '@/types/auth.types';

/**
 * Validates whether an email address format is correct.
 * 
 * @param email - The email string to validate.
 * @returns An object containing validation status and error message if invalid.
 */
export function isValidEmail(email: string): { isValid: boolean; error: string | null } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  return {
    isValid,
    error: isValid ? null : 'Please enter a valid email address',
  };
}

/**
 * Validates a phone number by stripping spaces and the "+91" prefix.
 * Ensures the result is exactly a 10-digit number.
 * 
 * @param phone - The phone string to validate.
 * @returns An object containing validation status and error message if invalid.
 */
export function isValidPhone(phone: string): { isValid: boolean; error: string | null } {
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+91/, '');
  const phoneRegex = /^\d{10}$/;
  const isValid = phoneRegex.test(cleaned);
  return {
    isValid,
    error: isValid ? null : 'Please enter a valid 10-digit phone number',
  };
}

/**
 * Validates a password ensuring it has at least 8 characters and contains at least one number.
 * 
 * @param password - The password string to validate.
 * @returns An object containing validation status and error message if invalid.
 */
export function isValidPassword(password: string): { isValid: boolean; error: string | null } {
  const hasMinLength = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const isValid = hasMinLength && hasDigit;
  return {
    isValid,
    error: isValid ? null : 'Password must be at least 8 characters and contain a number',
  };
}

/**
 * Validates that two password entries match exactly.
 * 
 * @param password - The primary password.
 * @param confirm - The confirmation password.
 * @returns An object containing validation status and error message if invalid.
 */
export function isPasswordMatch(password: string, confirm: string): { isValid: boolean; error: string | null } {
  const isValid = password === confirm;
  return {
    isValid,
    error: isValid ? null : 'Passwords do not match',
  };
}

/**
 * Validates that a user's name is at least 2 characters long and contains no numbers.
 * 
 * @param name - The name string to validate.
 * @returns An object containing validation status and error message if invalid.
 */
export function isValidName(name: string): { isValid: boolean; error: string | null } {
  const hasMinLength = name.trim().length >= 2;
  const hasNoNumbers = !/\d/.test(name);
  const isValid = hasMinLength && hasNoNumbers;
  return {
    isValid,
    error: isValid ? null : 'Please enter your full name',
  };
}

/**
 * Validates whether an OTP input is exactly 6 digits.
 * 
 * @param otp - The OTP string to validate.
 * @returns An object containing validation status and error message if invalid.
 */
export function isValidOtp(otp: string): { isValid: boolean; error: string | null } {
  const otpRegex = /^\d{6}$/;
  const isValid = otpRegex.test(otp);
  return {
    isValid,
    error: isValid ? null : 'Please enter the complete 6-digit code',
  };
}

/**
 * Validates all fields in a Signup form payload for devotee or priest.
 * 
 * @param payload - The devotee or priest signup payload.
 * @returns A record mapping field names to their respective validation error messages. An empty record indicates no errors.
 */
export function validateSignupForm(
  payload: SignupDevoteePayload | SignupPriestPayload
): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameVal = isValidName(payload.name);
  if (!nameVal.isValid && nameVal.error) errors.name = nameVal.error;

  const emailVal = isValidEmail(payload.email);
  if (!emailVal.isValid && emailVal.error) errors.email = emailVal.error;

  const phoneVal = isValidPhone(payload.phone);
  if (!phoneVal.isValid && phoneVal.error) errors.phone = phoneVal.error;

  if (payload.password !== undefined) {
    const passVal = isValidPassword(payload.password);
    if (!passVal.isValid && passVal.error) errors.password = passVal.error;
  }

  return errors;
}
