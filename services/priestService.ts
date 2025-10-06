// src/services/priestService.js
import api from '../api';

/**
 * Service for priest-related API calls
 */
const priestService = {
  /**
   * Get priest profile
   * @returns {Promise} Response from the API
   */
  getProfile: async (): Promise<any> => {
    try {
      const response = await api.get('/api/priest/profile');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch profile. Please try again.';
    }
  },

  /**
   * Update priest profile
   * @param {Object} profileData - The profile data to update
   * @returns {Promise} Response from the API
   */
  updateProfile: async (profileData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/priest/profile', profileData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to update profile. Please try again.';
    }
  },

  /**
   * Get priest's bookings
   * @param {string} status - Filter bookings by status (optional)
   * @returns {Promise} Response from the API
   */
  getBookings: async (priestId?: string, status?: string): Promise<any> => {
    try {
      const url = status ? `/api/priest/bookings?status=${status}&priestId=${priestId}` : `/api/priest/bookings?priestId=${priestId}`;
      // console.log("Fetching bookings from URL:", url);
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch bookings. Please try again.';
    }
  },

  /**
   * Get booking details
   * @param {string} bookingId - The booking ID
   * @returns {Promise} Response from the API
   */
  getBookingDetails: async (bookingId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/priest/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch booking details. Please try again.';
    }
  },

  /**
   * Update booking status
   * @param {string} bookingId - The booking ID
   * @param {string} status - The new status
   * @returns {Promise} Response from the API
   */
  updateBookingStatus: async (bookingId: string, status: string): Promise<any> => {
    try {
      const response = await api.put(`/api/priest/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to update booking status. Please try again.';
    }
  },

  /**
   * Get priest's earnings
   * @param {string} period - The period for earnings (optional)
   * @returns {Promise} Response from the API
   */
  getEarnings: async (priestId?: string, period?: string): Promise<any> => {
    try {
      const url = period ? `/api/priest/earnings?period=${period}&priestId=${priestId}` : `/api/priest/earnings?priestId=${priestId}`;
      // console.log("Fetching earnings from URL:", url);
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch earnings. Please try again.';
    }
  },

  /**
   * Request earnings withdrawal
   * @param {Object} withdrawalData - The withdrawal data
   * @returns {Promise} Response from the API
   */
  requestWithdrawal: async (withdrawalData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.post('/api/priest/earnings/withdraw', withdrawalData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to request withdrawal. Please try again.';
    }
  },

  /**
   * Get priest's transactions
   * @param {string} type - Filter transactions by type (optional)
   * @returns {Promise} Response from the API
   */
  getTransactions: async (type?: string): Promise<any> => {
    try {
      const url = type ? `/api/priest/transactions?type=${type}` : '/api/priest/transactions';
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch transactions. Please try again.';
    }
  },

  /**
   * Update priest's availability
   * @param {Object} availabilityData - The availability data
   * @returns {Promise} Response from the API
   */
  updateAvailability: async (availabilityData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/priest/availability', availabilityData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to update availability. Please try again.';
    }
  },

  /**
   * Update priest's services and pricing
   * @param {Object} servicesData - The services and pricing data
   * @returns {Promise} Response from the API
   */
  updateServices: async (servicesData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/priest/services', servicesData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to update services. Please try again.';
    }
  },

  /**
   * Upload priest's certification or ID documents
   * @param {FormData} formData - The form data with documents
   * @returns {Promise} Response from the API
   */
  uploadDocuments: async (formData: FormData): Promise<any> => {
    try {
      const response = await api.post('/api/priest/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to upload documents. Please try again.';
    }
  },

  /**
   * Get notifications for the priest
   * @returns {Promise} Response from the API
   */
  getNotifications: async (priestId?: string): Promise<any> => {
    try {
      const response = await api.get(`/api/priest/notifications?priestId=${priestId}`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch notifications. Please try again.';
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - The notification ID
   * @returns {Promise} Response from the API
   */
  markNotificationAsRead: async (notificationId: string): Promise<any> => {
    try {
      const response = await api.put(`/api/priest/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to mark notification as read. Please try again.';
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} Response from the API
   */
  markAllNotificationsAsRead: async (): Promise<any> => {
    try {
      const response = await api.put('/api/priest/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to mark all notifications as read. Please try again.';
    }
  },

  /**
   * Get priest's certificate or ID document
   * @param {string} documentId - The document ID
   * @returns {Promise} Response from the API
   */
  getDocument: async (documentId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/priest/documents/${documentId}`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch document. Please try again.';
    }
  },
};

export default priestService;