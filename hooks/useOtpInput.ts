import { useRef, useState, RefObject } from 'react';
import { TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

/**
 * Return type definition for the useOtpInput hook.
 */
export interface UseOtpInputReturn {
  digits: string[];
  inputRefs: RefObject<TextInput>[];
  handleDigitChange: (index: number, value: string) => void;
  handleKeyPress: (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  handlePaste: (text: string) => void;
  resetDigits: () => void;
  isComplete: boolean;
}

/**
 * Custom hook to handle state, refs, focus transitions, backspace clearing,
 * and copy-paste behavior for a segmented multi-box OTP input code.
 * 
 * @param length - The number of digits required in the OTP (default 6).
 * @returns State and functions to wire up the digit TextInputs.
 */
export function useOtpInput(length: number = 6): UseOtpInputReturn {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  
  // Create stable array of text input refs
  const ref1 = useRef<TextInput>(null);
  const ref2 = useRef<TextInput>(null);
  const ref3 = useRef<TextInput>(null);
  const ref4 = useRef<TextInput>(null);
  const ref5 = useRef<TextInput>(null);
  const ref6 = useRef<TextInput>(null);
  const inputRefs = [ref1, ref2, ref3, ref4, ref5, ref6];

  /** Handles digit change event in a box. Moves focus forward/back. */
  const handleDigitChange = (index: number, value: string): void => {
    const cleanChar = value.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    if (cleanChar !== '') {
      if (index < length - 1) {
        inputRefs[index + 1].current?.focus();
      }
    } else if (index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  /** Handles backspace key press event, especially on empty inputs. */
  const handleKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ): void => {
    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  /** Populates digits and focuses the last field when an OTP is pasted. */
  const handlePaste = (text: string): void => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    if (cleaned.length === length) {
      setDigits(cleaned.split(''));
      inputRefs[length - 1].current?.focus();
    }
  };

  /** Resets all text values to empty and focus the first box. */
  const resetDigits = (): void => {
    setDigits(Array(length).fill(''));
    inputRefs[0].current?.focus();
  };

  const isComplete = digits.every((d) => d !== '') && digits.length === length;

  return {
    digits,
    inputRefs,
    handleDigitChange,
    handleKeyPress,
    handlePaste,
    resetDigits,
    isComplete,
  };
}
