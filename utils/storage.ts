import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Platform-aware storage utility for tokens and user info.
 * Uses localStorage on web and expo-secure-store on native.
 */

export const saveToken = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('LocalStorage set error', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export const getToken = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('LocalStorage get error', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export const removeToken = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('LocalStorage remove error', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

// Aliases for compatibility if needed elsewhere
export const setItemAsync = saveToken;
export const getItemAsync = getToken;
export const deleteItemAsync = removeToken;
