import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Return shape of useStepperLogic. */
export interface StepperLogic {
  /** Current stepper value. */
  value: number;
  /** Increments the value by 1, clamped to max. */
  increment: () => void;
  /** Decrements the value by 1, clamped to min. */
  decrement: () => void;
  /** True when value equals min. */
  isAtMin: boolean;
  /** True when value equals max. */
  isAtMax: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook encapsulating stepper increment/decrement logic with clamped min/max bounds.
 *
 * @param min - Minimum allowed value (inclusive).
 * @param max - Maximum allowed value (inclusive).
 * @param initial - Starting value.
 * @returns Stepper state and control functions.
 */
export function useStepperLogic(min: number, max: number, initial: number): StepperLogic {
  const [value, setValue] = useState<number>(Math.max(min, Math.min(max, initial)));

  function increment(): void {
    setValue((prev) => Math.min(max, prev + 1));
  }

  function decrement(): void {
    setValue((prev) => Math.max(min, prev - 1));
  }

  return {
    value,
    increment,
    decrement,
    isAtMin: value <= min,
    isAtMax: value >= max,
  };
}
