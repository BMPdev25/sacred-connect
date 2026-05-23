import { useCallback, useEffect, useState } from 'react';

/**
 * Return type definition for the useCountdown hook.
 */
export interface UseCountdownReturn {
  secondsLeft: number;
  isExpired: boolean;
  reset: () => void;
}

/**
 * Custom hook to run a one-second step countdown timer.
 * Automatically handles starting, ticking down, and stopping at 0.
 * 
 * @param initialSeconds - The starting cooldown in seconds.
 * @returns Seconds remaining, expired flag, and reset function.
 */
export function useCountdown(initialSeconds: number): UseCountdownReturn {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  /** Resets the countdown back to the initial seconds. */
  const reset = useCallback((): void => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  const isExpired = secondsLeft === 0;

  return {
    secondsLeft,
    isExpired,
    reset,
  };
}
