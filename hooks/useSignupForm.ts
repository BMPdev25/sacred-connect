/**
 * useSignupForm — shared form state and field-level validation hook
 * used by both signup-devotee and signup-priest screens.
 */

import { useState } from 'react';

import {
  isPasswordMatch,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
  validateSignupForm,
} from '@/services/auth/authValidation';
import { SignupDevoteePayload, SignupPriestPayload } from '@/types/auth.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Names of all signup form fields. */
export type SignupField = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';

/** Controlled values for the signup form. */
export interface SignupFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

/** Per-field validation error strings. */
export type SignupFieldErrors = Partial<Record<SignupField, string>>;

/** Everything the signup screens need from this hook. */
export interface SignupFormHandle {
  formValues: SignupFormValues;
  fieldErrors: SignupFieldErrors;
  generalError: string | null;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  setGeneralError: (v: string | null) => void;
  handleFieldChange: (field: SignupField, value: string) => void;
  handleFieldBlur: (field: SignupField) => void;
  validateAll: () => boolean;
  buildPayload: <R extends 'devotee' | 'priest'>(role: R) => R extends 'devotee' ? SignupDevoteePayload : SignupPriestPayload;
  isFormComplete: () => boolean;
}

// ---------------------------------------------------------------------------
// Per-field validator dispatcher
// ---------------------------------------------------------------------------

/**
 * Runs the appropriate validator for a single field.
 * Returns an error string or null.
 */
function validateField(field: SignupField, values: SignupFormValues): string | null {
  switch (field) {
    case 'name':
      return isValidName(values.name).error;
    case 'email':
      return isValidEmail(values.email).error;
    case 'phone':
      return isValidPhone(values.phone).error;
    case 'password':
      return isValidPassword(values.password).error;
    case 'confirmPassword':
      return isPasswordMatch(values.password, values.confirmPassword).error;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const EMPTY_VALUES: SignupFormValues = {
  name: '', email: '', phone: '', password: '', confirmPassword: '',
};

/**
 * Shared form state, validation, and helpers for both signup screens.
 * Validation fires on blur (single field) and on submit (all fields).
 */
export function useSignupForm(): SignupFormHandle {
  const [formValues, setFormValues] = useState<SignupFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /** Updates a single field value and clears its existing error. */
  function handleFieldChange(field: SignupField, value: string): void {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  /** Validates a single field on blur and writes the error if any. */
  function handleFieldBlur(field: SignupField): void {
    const error = validateField(field, formValues);
    setFieldErrors((prev) => ({ ...prev, [field]: error ?? undefined }));
  }

  /**
   * Validates all fields at once. Updates fieldErrors and returns
   * true only if there are no validation errors.
   */
  function validateAll(): boolean {
    const payload = {
      name: formValues.name,
      email: formValues.email,
      phone: formValues.phone,
      password: formValues.password,
      role: 'devotee' as const, // role doesn't affect field validation
    };
    const baseErrors = validateSignupForm(payload);
    const confirmError = isPasswordMatch(formValues.password, formValues.confirmPassword).error;
    const allErrors: SignupFieldErrors = { ...baseErrors };
    if (confirmError) allErrors.confirmPassword = confirmError;
    setFieldErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  }

  /** Builds the typed payload for the authService call. */
  function buildPayload<R extends 'devotee' | 'priest'>(
    role: R
  ): R extends 'devotee' ? SignupDevoteePayload : SignupPriestPayload {
    return {
      name: formValues.name,
      email: formValues.email,
      phone: formValues.phone,
      password: formValues.password,
      role,
    } as any;
  }

  /** Returns true when every field has at least one character. */
  function isFormComplete(): boolean {
    return Object.values(formValues).every((v) => v.trim().length > 0);
  }

  return {
    formValues, fieldErrors, generalError, isLoading,
    setIsLoading, setGeneralError,
    handleFieldChange, handleFieldBlur, validateAll, buildPayload, isFormComplete,
  };
}
