// src/services/devoteeService.js
import api from '../api';

/**
 * Service for devotee-related API calls
 */
const devoteeService = {
  /**
   * Get devotee profile
   * @returns {Promise} Response from the API
   */
  getProfile: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/profile');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch profile. Please try again.';
    }
  },

  /**
   * Update devotee profile
   * @param {Object} profileData - The profile data to update
   * @returns {Promise} Response from the API
   */
  updateProfile: async (profileData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/devotee/profile', profileData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to update profile. Please try again.';
    }
  },

  /**
   * Get all priests (for debugging)
   * @returns {Promise} Response from the API
   */
  getAllPriests: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/priests/all');
      return response.data;
    } catch (error: any) {
      console.error('getAllPriests error:', error);
      // Return empty array instead of throwing error
      return { priests: [], total: 0 };
    }
  },

  /**
   * Search for priests
   * @param {Object} searchParams - The search parameters
   * @returns {Promise} Response from the API
   */
  searchPriests: async (searchParams: Record<string, any>): Promise<any> => {
    try {
      // console.log('Calling searchPriests API with params:', searchParams);
      const response = await api.get('/api/devotee/priests', { params: searchParams });
      // console.log('searchPriests response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('searchPriests error:', error);
      throw error?.response?.data?.message || 'Failed to search priests. Please try again.';
    }
  },

  /**
   * Get priest details
   * @param {string} priestId - The priest ID
   * @returns {Promise} Response from the API
   */
  getPriestDetails: async (priestId: string): Promise<any> => {
    try {
      console.log("devoteeService: getPriestDetails for id:", priestId);
      const response = await api.get(`/api/devotee/priests/${priestId}`);
      return response.data;
    } catch (error: any) {
      console.error("devoteeService: getPriestDetails error:", error);
      throw error?.response?.data?.message || 'Failed to fetch priest details. Please try again.';
    }
  },

  /**
   * Get priest's availability
   * @param {string} priestId - The priest ID
   * @param {string} date - The date to check availability (optional)
   * @returns {Promise} Response from the API
   */
  getPriestAvailability: async (priestId: string, date?: string): Promise<any> => {
    try {
      const url = date
        ? `/api/devotee/priests/${priestId}/availability?date=${date}`
        : `/api/devotee/priests/${priestId}/availability`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch priest availability. Please try again.';
    }
  },

  /**
   * Get devotee's bookings
   * @param {string} status - Filter bookings by status (optional)
   * @returns {Promise} Response from the API
   */
  getBookings: async (status?: string): Promise<any> => {
    try {
      const url = status ? `/api/devotee/bookings?status=${status}` : '/api/devotee/bookings';
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch bookings. Please try again.';
    }
  },

  /**
   * Get home screen banners
   */
  getBanners: async (): Promise<any> => {
    try {
      const response = await api.get('/api/metadata/banners');
      return response.data;
    } catch (error: any) {
      console.error('getBanners error:', error);
      return [];
    }
  },

  /**
   * Get Panchang data for today or specific date
   */
  getPanchang: async (date?: string): Promise<any> => {
    try {
      const url = date ? `/api/metadata/panchang?date=${date}` : '/api/metadata/panchang';
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('getPanchang error:', error);
      return null;
    }
  },

  /**
   * Get ceremony categories
   */
  getCategories: async (): Promise<any> => {
    try {
      const response = await api.get('/api/metadata/categories');
      return response.data;
    } catch (error: any) {
      console.error('getCategories error:', error);
      return [];
    }
  },

  /**
   * Get booking details
   * @param {string} bookingId - The booking ID
   * @returns {Promise} Response from the API
   */
  getBookingDetails: async (bookingId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/devotee/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch booking details. Please try again.';
    }
  },

  /**
   * Create a new booking
   * @param {Object} bookingData - The booking data
   * @returns {Promise} Response from the API
   */
  createBooking: async (bookingData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.post('/api/devotee/bookings', bookingData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to create booking. Please try again.';
    }
  },
  
  /**
   * Book an instant ceremony
   * @param {Object} instantData - The instant booking data (ceremonyType, coords, etc)
   */
  bookInstantCeremony: async (instantData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.post('/api/devotee/bookings/instant', instantData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to initiate instant booking.';
    }
  },

  /**
   * Cancel a booking
   * @param {string} bookingId - The booking ID
   * @param {Object} cancellationData - The cancellation data (reason, etc.)
   * @returns {Promise} Response from the API
   */
  cancelBooking: async (bookingId: string, cancellationData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put(`/api/bookings/${bookingId}/cancel-devotee`, cancellationData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to cancel booking. Please try again.';
    }
  },

  /**
   * Process payment for a booking
   * @param {string} bookingId - The booking ID
   * @param {Object} paymentData - The payment data
   * @returns {Promise} Response from the API
   */
  processPayment: async (bookingId: string, paymentData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.post(`/api/devotee/bookings/${bookingId}/payment`, paymentData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to process payment. Please try again.';
    }
  },

  /**
   * Submit a review for a priest
   * @param {Object} reviewData - The review data
   * @returns {Promise} Response from the API
   */
  submitReview: async (reviewData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.post('/api/reviews/submit', reviewData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to submit review. Please try again.';
    }
  },

  /**
   * Get pending actions for devotee
   * @returns {Promise} Response from the API
   */
  getPendingActions: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/pending-actions');
      return response.data;
    } catch (error: any) {
      console.error('getPendingActions error:', error);
      return []; // Return empty array on error to prevent UI crash
    }
  },

  /**
   * Get reviews for a priest
   * @param {string} priestId - The priest ID
   * @returns {Promise} Response from the API
   */
  getPriestReviews: async (priestId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/devotee/priests/${priestId}/reviews`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch reviews. Please try again.';
    }
  },

  /**
   * Get ceremonies/services offered
   * @returns {Promise} Response from the API
   */
  getCeremonies: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/ceremonies');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch ceremonies. Please try again.';
    }
  },

  /**
   * Get ceremony details
   * @param {string} ceremonyId - The ceremony ID
   * @returns {Promise} Response from the API
   */
  getCeremonyDetails: async (ceremonyId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/devotee/ceremonies/${ceremonyId}`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch ceremony details. Please try again.';
    }
  },

  /**
   * Save a priest as favorite
   * @param {string} priestId - The priest ID
   * @returns {Promise} Response from the API
   */
  addFavoritePriest: async (priestId: string): Promise<any> => {
    try {
      const response = await api.post('/api/devotee/favorites', { priestId });
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to add favorite. Please try again.';
    }
  },

  /**
   * Remove a priest from favorites
   * @param {string} priestId - The priest ID
   * @returns {Promise} Response from the API
   */
  removeFavoritePriest: async (priestId: string): Promise<any> => {
    try {
      const response = await api.delete(`/api/devotee/favorites/${priestId}`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to remove favorite. Please try again.';
    }
  },

  /**
   * Get favorite priests
   * @returns {Promise} Response from the API
   */
  getFavoritePriests: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/favorites');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch favorites. Please try again.';
    }
  },

  /**
   * Get active booking requests (pending / confirmed / cancelled) for status tracking
   * @returns {Promise} Response from the API
   */
  getMyRequests: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/bookings');
      const all = Array.isArray(response.data) ? response.data : response.data?.data || [];
      // Only return non-completed bookings so the devotee can track request status
      return all.filter((b: any) => b.status !== 'completed');
    } catch (error: any) {
      console.error('getMyRequests error:', error);
      return [];
    }
  },

  /**
   * Get notifications for the devotee
   * @returns {Promise} Response from the API
   */
  getNotifications: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/notifications');
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
      const response = await api.put(`/api/devotee/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to mark notification as read. Please try again.';
    }
  },
  /**
   * Get user addresses
   */
  getAddresses: async (): Promise<any> => {
    try {
      const response = await api.get('/api/devotee/addresses');
      return response.data;
    } catch (error: any) {
        console.error("Error fetching addresses:", error);
        throw error?.response?.data?.message || "Failed to fetch addresses.";
    }
  },

  /**
   * Add new address
   * @param addressData address object
   */
  addAddress: async (addressData: any): Promise<any> => {
    try {
      const response = await api.post('/api/devotee/addresses', addressData);
      return response.data;
    } catch (error: any) {
        console.error("Error adding address:", error);
        throw error?.response?.data?.message || "Failed to add address.";
    }
  },

  /**
   * Update address
   * @param addressId string
   * @param addressData address object
   */
  updateAddress: async (addressId: string, addressData: any): Promise<any> => {
    try {
      const response = await api.put(`/api/devotee/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error: any) {
        console.error("Error updating address:", error);
        throw error?.response?.data?.message || "Failed to update address.";
    }
  },

  /**
   * Delete address
   * @param addressId string
   */
  deleteAddress: async (addressId: string): Promise<any> => {
    try {
      const response = await api.delete(`/api/devotee/addresses/${addressId}`);
      return response.data;
    } catch (error: any) {
        console.error("Error deleting address:", error);
        throw error?.response?.data?.message || "Failed to delete address.";
    }
  }
};

export default devoteeService;