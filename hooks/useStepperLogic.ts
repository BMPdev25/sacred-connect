import { useEffect, useState } from 'react';

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
 * Pure logic version that does not use internal state to prevent sync loops.
 *
 * @param min - Minimum allowed value (inclusive).
 * @param max - Maximum allowed value (inclusive).
 * @param currentValue - Current value from external state.
 * @param onChange - Callback to update the value.
 * @returns Stepper state and control functions.
 */
export function useStepperLogic(
  min: number,
  max: number,
  currentValue: number,
  onChange: (newValue: number) => void
): StepperLogic {
  function increment(): void {
    onChange(Math.min(max, currentValue + 1));
  }

  function decrement(): void {
    onChange(Math.max(min, currentValue - 1));
  }

  return {
    value: currentValue,
    increment,
    decrement,
    isAtMin: currentValue <= min,
    isAtMax: currentValue >= max,
  };
}
