// src/utils/validationUtils.js

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;

  // Simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indian phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;

  // Remove all non-numeric characters
  const cleaned = ('' + phone).replace(/\D/g, '');

  // Check if it's a 10-digit number (India format)
  return cleaned.length === 10;
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} Result with isValid status and feedback message
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required',
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  // Check for a mix of uppercase, lowercase, numbers, and special characters
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecial) {
    return {
      isValid: false,
      message: 'Password must include uppercase, lowercase, numbers, and special characters',
    };
  }

  return {
    isValid: true,
    message: 'Password is strong',
  };
};

/**
 * Validate name format
 * @param {string} name - The name to validate
 * @returns {boolean} Whether the name is valid
 */
export const isValidName = (name) => {
  if (!name) return false;

  // Name should be at least 2 characters long and contain only letters and spaces
  const nameRegex = /^[A-Za-z\s]{2,}$/;
  return nameRegex.test(name);
};

/**
 * Validate date format and check if it's a future date
 * @param {string} dateString - The date string to validate
 * @returns {boolean} Whether the date is valid and in the future
 */
export const isValidFutureDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const today = new Date();

    // Set both dates to midnight for fair comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    // Check if date is in the future
    return date >= today;
  } catch (error) {
    return false;
  }
};

/**
 * Validate time format (HH:MM)
 * @param {string} timeString - The time string to validate
 * @returns {boolean} Whether the time is valid
 */
export const isValidTime = (timeString) => {
  if (!timeString) return false;

  // Time format: HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Validate amount (positive number)
 * @param {number|string} amount - The amount to validate
 * @returns {boolean} Whether the amount is valid
 */
export const isValidAmount = (amount) => {
  if (amount === undefined || amount === null || amount === '') return false;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  return !isNaN(numAmount) && numAmount > 0;
};

/**
 * Validate UPI ID format
 * @param {string} upiId - The UPI ID to validate
 * @returns {boolean} Whether the UPI ID is valid
 */
export const isValidUpiId = (upiId) => {
  if (!upiId) return false;

  // UPI ID format: username@upi
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upiId);
};