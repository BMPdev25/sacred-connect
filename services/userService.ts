// src/services/userService.js
import api from '../api';

const userService = {
  // Profile Management
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Profile Picture Management
  uploadProfilePicture: async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const response = await api.post('/user/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteProfilePicture: async () => {
    try {
      const response = await api.delete('/user/profile/picture');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Security Features
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/user/security/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateSecuritySettings: async (settings) => {
    try {
      const response = await api.put('/user/security/settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Privacy Settings
  updatePrivacySettings: async (settings) => {
    try {
      const response = await api.put('/user/privacy/settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Notification Preferences
  updateNotificationPreferences: async (preferences) => {
    try {
      const response = await api.put('/user/notifications', preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Account Management
  deleteAccount: async (password, confirmationText) => {
    try {
      const response = await api.delete('/user/account', {
        data: { password, confirmationText },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
