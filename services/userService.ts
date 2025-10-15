// src/services/userService.js
import api from '../api';

const userService = {
  // Profile Management
  getProfile: async (): Promise<any> => {
    try {
      const response = await api.get('/api/user/profile');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateProfile: async (profileData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/user/profile', profileData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Profile Picture Management
  uploadProfilePicture: async (imageUri: string): Promise<any> => {
    try {
      const formData = new FormData();

      // For React Native FormData, append directly with an object is common; TypeScript may require casting
      // Use any to avoid type mismatch with different environments
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await api.post('/user/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  deleteProfilePicture: async (): Promise<any> => {
    try {
      const response = await api.delete('/user/profile/picture');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Security Features
  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    try {
      const response = await api.post('/user/security/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateSecuritySettings: async (settings: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/user/security/settings', settings);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Privacy Settings
  updatePrivacySettings: async (settings: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/user/privacy/settings', settings);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Notification Preferences
  updateNotificationPreferences: async (preferences: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put('/api/user/notifications', preferences);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Account Management
  deleteAccount: async (password: string, confirmationText: string): Promise<any> => {
    try {
      const response = await api.delete('/user/account', {
        data: { password, confirmationText },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default userService;
