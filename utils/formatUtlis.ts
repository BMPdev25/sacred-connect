// src/utils/formatUtils.js

/**
 * Format currency in Indian Rupees format
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the symbol (₹)
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount: number | string, showSymbol = true): string => {
  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if valid number
  if (isNaN(Number(numAmount))) {
    return showSymbol ? '₹0' : '0';
  }

  // Format to Indian Rupees
  // 1,00,000 format vs 100,000 format
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(Number(numAmount));

  // Remove the symbol if not required
  return showSymbol ? formatted : formatted.replace('₹', '');
};

/**
 * Format phone number to a readable format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} The formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');

  // Check if it's a 10-digit number (India format)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5, 10)}`;
  }

  // Return as is if it doesn't match the expected format
  return phoneNumber;
};

/**
 * Truncate text to a specific length and add ellipsis if needed
 * @param {string} text - The text to truncate
 * @param {number} length - The length to truncate to
 * @returns {string} The truncated text
 */
export const truncateText = (text: string | undefined | null, length: number): string => {
  if (!text) return '';

  if (text.length <= length) {
    return text;
  }

  return text.substring(0, length) + '...';
};

/**
 * Convert a simple string to title case
 * @param {string} text - The text to convert
 * @returns {string} The title case text
 */
export const toTitleCase = (text: string | undefined | null): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format ceremony duration in hours and minutes
 * @param {string} startTime - The start time (format: 'HH:MM')
 * @param {string} endTime - The end time (format: 'HH:MM')
 * @returns {string} The formatted duration
 */
export const formatDuration = (startTime: string, endTime: string): string => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startInMinutes = startHours * 60 + startMinutes;
  const endInMinutes = endHours * 60 + endMinutes;

  // Calculate the difference in minutes
  let durationMinutes = endInMinutes - startInMinutes;

  // Handle cases where the end time is on the next day
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${minutes} min`;
  }
};

/**
 * Format a number as a percentage
 * @param {number} value - The value to format
 * @param {number} decimals - The number of decimal places
 * @returns {string} The formatted percentage
 */
export const formatPercentage = (value: number, decimals = 0): string => {
  if (isNaN(value)) return '0%';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value / 100);
};