import axios, { AxiosInstance } from 'axios';
import { getToken, removeToken } from '../utils/storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Helper function to determine the correct API URL
const getBaseURL = (): string => {
  if (Platform.OS === 'web') return 'http://localhost:5000';
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
};

// Export for use in other files
export const API_BASE_URL = getBaseURL();

// Create axios instance with proper configuration
const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // change this later
  headers: {
    'Content-Type': 'application/json',
  }
});

// Callback for logout - will be set by app initialization
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

import { auth } from '../config/firebase';

// Request interceptor to attach Authorization header with JWT from Firebase
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Check for active Firebase Session natively
      if (auth.currentUser) {
         // This automatically handles token refresh in the background
         const token = await auth.currentUser.getIdToken();
         (config.headers as any) = config.headers || {};
         (config.headers as any)['Authorization'] = `Bearer ${token}`;
      } else {
         // 2. Fallback to Local Storage token if Firebase SDK hasn't fully initialized
         const token = await getToken('userToken');
         if (token) {
           (config.headers as any) = config.headers || {};
           (config.headers as any)['Authorization'] = `Bearer ${token}`;
         }
      }
    } catch (e) {
      console.warn('Failed to read token in api interceptor', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration (401 errors)
api.interceptors.response.use(
  (response) => {
    // If response is successful, just return it
    return response;
  },
  async (error) => {
    // Check if error is due to unauthorized access (token expired/invalid)
      // Check if the error is from the login endpoint
      // If it is, we don't want to auto-logout, we just want to return the error
      // to the component so it can display "Invalid credentials"
      const requestUrl = error.config?.url || '';
      const isLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/firebase-login') || requestUrl.includes('/auth/register');
      
      if (error.response && error.response.status === 401 && !isLoginRequest) {
        console.log('🔒 Token expired or invalid - Auto-logout initiated');
        
        try {
          // Clear stored credentials
          await removeToken('userToken');
          await removeToken('userInfo');
          
          // Call logout callback if set (to clear Redux state)
          if (logoutCallback) {
            logoutCallback();
          }
        
        // Redirect to login screen
        // Use replace to prevent going back to authenticated screens
        router.replace('/login');
        
        console.log('✅ Auto-logout completed - Redirected to login');
      } catch (logoutError) {
        console.error('❌ Error during auto-logout:', logoutError);
      }
    }
    
    // Reject the promise with the error
    return Promise.reject(error);
  }
);

export default api;
