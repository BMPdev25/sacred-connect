import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Helper function to determine the correct API URL
const getBaseURL = (): string => {
  return 'http://192.168.29.44:5000'; // Updated to match backend port
};

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

// Request interceptor to attach Authorization header with JWT from SecureStore
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        // cast to any to avoid Axios header typing issues
        (config.headers as any) = config.headers || {};
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore SecureStore errors; proceed without token
      console.warn('Failed to read token from SecureStore in api interceptor', e);
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
    if (error.response && error.response.status === 401) {
      console.log('🔒 Token expired or invalid - Auto-logout initiated');
      
      try {
        // Clear stored credentials
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userInfo');
        
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
