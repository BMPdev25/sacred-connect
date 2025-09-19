// src/utils/dateUtils.js

/**
 * Format a date string to a user-friendly format
 * @param {string} dateString - The date string to format
 * @param {string} format - The format to use (default: 'full')
 * @returns {string} The formatted date string
 */
export type DateFormat = 'full' | 'medium' | 'short' | 'monthYear' | string;

export const formatDate = (dateString: string | Date, format: DateFormat = 'full'): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : new Date(dateString);

  switch (format) {
    case 'full':
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'medium':
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'short':
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    case 'monthYear':
      return date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
    default:
      return date.toLocaleDateString('en-IN');
  }
};

/**
 * Format a time string to a user-friendly format
 * @param {string} timeString - The time string to format (format: 'HH:MM')
 * @returns {string} The formatted time string
 */
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return `${displayHour}:${minutes} ${suffix}`;
};

/**
 * Get the next N days from today
 * @param {number} days - Number of days to get
 * @returns {Array} Array of date objects
 */
export const getNextNDays = (days: number): Date[] => {
  const result: Date[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    result.push(date);
  }

  return result;
};

/**
 * Check if a date is today
 * @param {Date|string} date - The date to check
 * @returns {boolean} Whether the date is today
 */
export const isToday = (date: Date | string): boolean => {
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : new Date(date);

  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - The date to check
 * @returns {boolean} Whether the date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : new Date(date);

  // Set both dates to midnight for fair comparison
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
};

/**
 * Get the day of week name from a date
 * @param {Date|string} date - The date to get the day name from
 * @returns {string} The day name
 */
export const getDayName = (date: Date | string): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const checkDate = typeof date === 'string' ? new Date(date) : new Date(date);

  return days[checkDate.getDay()];
};

/**
 * Get the month name from a date
 * @param {Date|string} date - The date to get the month name from
 * @returns {string} The month name
 */
export const getMonthName = (date: Date | string): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const checkDate = typeof date === 'string' ? new Date(date) : new Date(date);

  return months[checkDate.getMonth()];
};