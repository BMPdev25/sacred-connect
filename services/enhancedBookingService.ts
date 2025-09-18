// src/services/enhancedBookingService.js
import api from '../api';

const enhancedBookingService = {
  // Get bookings with categorization
  getBookings: async (category = 'all', status = 'all', page = 1, limit = 10) => {
    const response = await api.get('/bookings', {
      params: { category, status, page, limit }
    });
    return response.data;
  },

  // Get detailed booking information
  getBookingDetails: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status, reason = '') => {
    const response = await api.put(`/bookings/${bookingId}/status`, {
      status,
      reason
    });
    return response.data;
  },

  // Mark booking as completed (for devotees)
  markAsCompleted: async (bookingId) => {
    const response = await api.post(`/bookings/${bookingId}/complete`);
    return response.data;
  },

  // Payment related functions
  createPaymentOrder: async (bookingId, amount) => {
    const response = await api.post('/bookings/payment/order', {
      bookingId,
      amount
    });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/bookings/payment/verify', paymentData);
    return response.data;
  },

  getPaymentDetails: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/payment`);
    return response.data;
  },
};

export default enhancedBookingService;
