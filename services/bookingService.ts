// src/services/bookingService.js
import api from '../api';

/**
 * Service for booking-related API calls
 */
const bookingService = {
  /**
   * Create a booking
   * @param {Object} bookingData - Booking details
   * @returns {Promise} Response from the API
   */
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/api/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create booking. Please try again.';
    }
  },

  /**
   * Get booking details
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Response from the API
   */
  getBookingDetails: async (bookingId) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch booking details. Please try again.';
    }
  },

  /**
   * Get bookings
   * @param {Object} params - Query parameters for filtering bookings
   * @returns {Promise} Response from the API
   */
  getBookings: async (params = {}) => {
    try {
      const response = await api.get('/api/bookings', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch bookings. Please try again.';
    }
  },

  /**
   * Update booking status
   * @param {string} bookingId - Booking ID
   * @param {string} status - New status
   * @returns {Promise} Response from the API
   */
  updateBookingStatus: async (bookingId, status) => {
    try {
      const response = await api.put(`/api/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update booking status. Please try again.';
    }
  },

  /**
   * Cancel booking
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Response from the API
   */
  cancelBooking: async (bookingId, reason) => {
    try {
      const response = await api.put(`/api/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to cancel booking. Please try again.';
    }
  },

  /**
   * Process payment for a booking
   * @param {string} bookingId - Booking ID
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise} Response from the API
   */
  processPayment: async (bookingId, paymentDetails) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/payment`, paymentDetails);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to process payment. Please try again.';
    }
  },

  /**
   * Get payment status for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Response from the API
   */
  getPaymentStatus: async (bookingId) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}/payment`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch payment status. Please try again.';
    }
  },

  /**
   * Add notes to a booking
   * @param {string} bookingId - Booking ID
   * @param {string} notes - Notes to add
   * @returns {Promise} Response from the API
   */
  addNotes: async (bookingId, notes) => {
    try {
      const response = await api.put(`/api/bookings/${bookingId}/notes`, { notes });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to add notes. Please try again.';
    }
  },

  /**
   * Rate and review a completed booking
   * @param {string} bookingId - Booking ID
   * @param {Object} reviewData - Review data (rating, comment)
   * @returns {Promise} Response from the API
   */
  submitReview: async (bookingId, reviewData) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/review`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to submit review. Please try again.';
    }
  },

  /**
   * Get available time slots for a specific priest on a specific date
   * @param {string} priestId - Priest ID
   * @param {string} date - Date in ISO format
   * @returns {Promise} Response from the API
   */
  getAvailableTimeSlots: async (priestId, date) => {
    try {
      const response = await api.get(`/api/bookings/timeslots`, {
        params: { priestId, date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch available time slots. Please try again.';
    }
  },

  /**
   * Check priest availability for a specific time and date
   * @param {string} priestId - Priest ID
   * @param {string} date - Date in ISO format
   * @param {string} startTime - Start time (format: HH:MM)
   * @param {string} endTime - End time (format: HH:MM)
   * @returns {Promise} Response from the API
   */
  checkAvailability: async (priestId, date, startTime, endTime) => {
    try {
      const response = await api.get('/api/bookings/check-availability', {
        params: { priestId, date, startTime, endTime }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to check availability. Please try again.';
    }
  },

  /**
   * Request booking modification
   * @param {string} bookingId - Booking ID
   * @param {Object} changes - Requested changes
   * @returns {Promise} Response from the API
   */
  requestModification: async (bookingId, changes) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/modification`, changes);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to request modification. Please try again.';
    }
  },

  /**
   * Accept or reject a modification request
   * @param {string} bookingId - Booking ID
   * @param {string} modificationId - Modification request ID
   * @param {boolean} accepted - Whether the modification is accepted
   * @returns {Promise} Response from the API
   */
  respondToModification: async (bookingId, modificationId, accepted) => {
    try {
      const response = await api.put(`/api/bookings/${bookingId}/modification/${modificationId}`, {
        accepted
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to respond to modification request. Please try again.';
    }
  },

  /**
   * Get ceremony types with prices for a specific priest
   * @param {string} priestId - Priest ID
   * @returns {Promise} Response from the API
   */
  getPriestCeremonies: async (priestId) => {
    try {
      const response = await api.get(`/api/bookings/ceremonies/${priestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch ceremony types. Please try again.';
    }
  },
};

export default bookingService