// src/utils/validators.js
/**
 * Utility functions for form validation
 */

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (10 digits)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Validate password strength
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Validate if passwords match
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// Get password strength message
export interface PasswordStrengthResult {
  strength: number;
  message: string;
}

export const getPasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) return { strength: 0, message: '' };

  if (password.length < 6) {
    return {
      strength: 1,
      message: 'Very weak - use at least 6 characters'
    };
  }

  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  let message = '';
  switch(strength) {
    case 1:
      message = 'Weak password';
      break;
    case 2:
      message = 'Fair password';
      break;
    case 3:
      message = 'Good password';
      break;
    case 4:
      message = 'Strong password';
      break;
    case 5:
      message = 'Very strong password';
      break;
    default:
      message = 'Invalid password';
  }

  return { strength, message };
};

// Validate form fields
export type FormFields = Record<string, any>;
export type FormErrors = Record<string, string>;

export const validateForm = (fields: FormFields): FormErrors => {
  const errors: FormErrors = {};

  Object.keys(fields).forEach(key => {
    const value = fields[key];

    // Required field check
    if (fields[`${key}Required`] && !value) {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      return;
    }

    // Specific field validations
    switch(key) {
      case 'email':
        if (value && !isValidEmail(value)) {
          errors[key] = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !isValidPhone(value)) {
          errors[key] = 'Please enter a valid 10-digit phone number';
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          errors[key] = 'Password must be at least 6 characters';
        }
        break;
      case 'confirmPassword':
        if (value && value !== fields.password) {
          errors[key] = 'Passwords do not match';
        }
        break;
      default:
        break;
    }
  });

  return errors;
};