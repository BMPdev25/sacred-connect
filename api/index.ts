/**
 * Axios instance configuration with automatic Firebase JWT authorization interceptor.
 */

import axios from 'axios';
import { auth } from '@/config/firebase';
import { API_TIMEOUT } from '@/constants/config';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: API_TIMEOUT,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // Fail silently for request interceptor token retrieval; let the request proceed or fail at backend
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
