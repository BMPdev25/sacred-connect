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
  getProfile: async () => {
    try {
      const response = await api.get('/api/priest/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch profile. Please try again.';
    }
  },

  /**
   * Update priest profile
   * @param {Object} profileData - The profile data to update
   * @returns {Promise} Response from the API
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/priest/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update profile. Please try again.';
    }
  },

  /**
   * Get priest's bookings
   * @param {string} status - Filter bookings by status (optional)
   * @returns {Promise} Response from the API
   */
  getBookings: async (status) => {
    try {
      const url = status ? `/api/priest/bookings?status=${status}` : '/api/priest/bookings';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch bookings. Please try again.';
    }
  },

  /**
   * Get booking details
   * @param {string} bookingId - The booking ID
   * @returns {Promise} Response from the API
   */
  getBookingDetails: async (bookingId) => {
    try {
      const response = await api.get(`/api/priest/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch booking details. Please try again.';
    }
  },

  /**
   * Update booking status
   * @param {string} bookingId - The booking ID
   * @param {string} status - The new status
   * @returns {Promise} Response from the API
   */
  updateBookingStatus: async (bookingId, status) => {
    try {
      const response = await api.put(`/api/priest/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update booking status. Please try again.';
    }
  },

  /**
   * Get priest's earnings
   * @param {string} period - The period for earnings (optional)
   * @returns {Promise} Response from the API
   */
  getEarnings: async (period) => {
    try {
      const url = period ? `/api/priest/earnings?period=${period}` : '/api/priest/earnings';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch earnings. Please try again.';
    }
  },

  /**
   * Request earnings withdrawal
   * @param {Object} withdrawalData - The withdrawal data
   * @returns {Promise} Response from the API
   */
  requestWithdrawal: async (withdrawalData) => {
    try {
      const response = await api.post('/api/priest/earnings/withdraw', withdrawalData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to request withdrawal. Please try again.';
    }
  },

  /**
   * Get priest's transactions
   * @param {string} type - Filter transactions by type (optional)
   * @returns {Promise} Response from the API
   */
  getTransactions: async (type) => {
    try {
      const url = type ? `/api/priest/transactions?type=${type}` : '/api/priest/transactions';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch transactions. Please try again.';
    }
  },

  /**
   * Update priest's availability
   * @param {Object} availabilityData - The availability data
   * @returns {Promise} Response from the API
   */
  updateAvailability: async (availabilityData) => {
    try {
      const response = await api.put('/api/priest/availability', availabilityData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update availability. Please try again.';
    }
  },

  /**
   * Update priest's services and pricing
   * @param {Object} servicesData - The services and pricing data
   * @returns {Promise} Response from the API
   */
  updateServices: async (servicesData) => {
    try {
      const response = await api.put('/api/priest/services', servicesData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update services. Please try again.';
    }
  },

  /**
   * Upload priest's certification or ID documents
   * @param {FormData} formData - The form data with documents
   * @returns {Promise} Response from the API
   */
  uploadDocuments: async (formData) => {
    try {
      const response = await api.post('/api/priest/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to upload documents. Please try again.';
    }
  },

  /**
   * Get notifications for the priest
   * @returns {Promise} Response from the API
   */
  getNotifications: async () => {
    try {
      const response = await api.get('/api/priest/notifications');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch notifications. Please try again.';
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - The notification ID
   * @returns {Promise} Response from the API
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/priest/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to mark notification as read. Please try again.';
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} Response from the API
   */
  markAllNotificationsAsRead: async () => {
    try {
      const response = await api.put('/api/priest/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to mark all notifications as read. Please try again.';
    }
  },

  /**
   * Get priest's certificate or ID document
   * @param {string} documentId - The document ID
   * @returns {Promise} Response from the API
   */
  getDocument: async (documentId) => {
    try {
      const response = await api.get(`/api/priest/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch document. Please try again.';
    }
  },
};

export default priestService;