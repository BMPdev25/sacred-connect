import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Helper function to determine the correct API URL
const getBaseURL = (): string => {
  return 'http://192.168.7.101:5000'; // Updated to match backend port
};

// Create axios instance with proper configuration
const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // change this later
  headers: {
    'Content-Type': 'application/json',
  }
});

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

export default api;
