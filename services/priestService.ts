// src/services/priestService.js
import api, { API_BASE_URL } from '../api';

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
   * Get profile completion percentage
   * @returns {Promise} Response from the API
   */
  getProfileCompletion: async (): Promise<any> => {
    try {
      const response = await api.get('/api/priest/profile-completion');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch profile completion. Please try again.';
    }
  },

  /**
   * Get pujaris who can perform a specific ceremony
   * Supports optional radius + location filtering
   * @param {Object} params - ceremonyId, lat?, lng?, radius?
   */
  getAvailablePujaris: async (params: {
    ceremonyId: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<any> => {
    try {
      const response = await api.get('/api/priest/available', {
        params: {
          ceremonyId: params.ceremonyId,
          lat: params.lat,
          lng: params.lng,
          radius: params.radius ?? 10,
        },
      });
      return response.data.pujaris;
    } catch (error: any) {
      throw (
        error?.response?.data?.message ||
        'Failed to fetch available pujaris. Please try again.'
      );
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
      return response.data.data || response.data;
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
  updateBookingStatus: async (bookingId: string, status: string, notes?: string): Promise<any> => {
    try {
      const response = await api.put(`/api/priest/bookings/${bookingId}/status`, { status, notes });
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


  /**
   * Update priest's services and pricing
   * @param {Object} servicesData - The services and pricing data
   * @returns {Promise} Response from the API
   */

  /**
   * Upload priest's certification or ID documents
   * @param {Object} fileData - { uri, name, type }
   * @param {string} documentType - government_id, religious_certificate, etc.
   * @returns {Promise} Response from the API
   */
  uploadDocument: async (fileData: { uri: string; name: string; type: string }, documentType: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: fileData.uri,
        name: fileData.name,
        type: fileData.type,
      } as any);
      formData.append('documentType', documentType);

      const response = await api.post('/api/priest/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to upload document. Please try again.';
    }
  },

  /**
   * Get document URL for viewing
   * @param documentType - Type of document (government_id, religious_certificate)
   * @returns {string} URL to the document endpoint
   */
  getDocumentUrl: (documentType: string): string => {
    return `${API_BASE_URL}/api/priest/documents/${documentType}`;
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
  /**
   * Toggle priest status
   * @param {Object} data - { status: 'available'|'offline', autoToggle?: boolean }
   * @returns {Promise} Response from the API
   */
  toggleStatus: async (data: { status?: string, autoToggle?: boolean }): Promise<any> => {
    try {
      const response = await api.put('/api/priest/status', data);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to update status. Please try again.';
    }
  },

  /**
   * Get recent reviews
   * @returns {Promise} Response from the API
   */
  getRecentReviews: async (): Promise<any> => {
    try {
      const response = await api.get('/api/reviews/recent');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch recent reviews. Please try again.';
    }
  },

  /**
   * Get user reviews
   * @param {string} userId - The user ID
   * @returns {Promise} Response from the API
   */
  getUserReviews: async (userId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/reviews/user/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch user reviews. Please try again.';
    }
  },

  /**
   * Get pending actions
   * @returns {Promise} Response from the API
   */
  getPendingActions: async (): Promise<any> => {
    try {
      const response = await api.get('/api/priest/bookings/pending-actions');
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to fetch pending actions. Please try again.';
    }
  },

  /**
   * Submit a review
   * @param {Object} reviewData - The review data
   * @returns {Promise} Response from the API
   */
  submitReview: async (reviewData: any): Promise<any> => {
    try {
      const response = await api.post('/api/reviews/submit', reviewData);
      return response.data;
    } catch (error: any) {
      throw error?.response?.data?.message || 'Failed to submit review. Please try again.';
    }
  },
};

export default priestService;