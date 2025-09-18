import axios, { AxiosInstance } from 'axios';

// Helper function to determine the correct API URL
const getBaseURL = (): string => {
   return 'http://localhost:3000';
};

// Create axios instance with proper configuration
const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // change this later
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;
