import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a rapidly changing value (e.g. text input).
 *
 * @param value - The value to debounce.
 * @param delay - Time to wait in milliseconds after the last change.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
