// src/redux/slices/userSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import userService from '../../services/userService';

// Define types for Profile, Security Settings, Privacy Settings, Notification Preferences
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  // Add other user profile fields
  security?: SecuritySettings;
  privacy?: PrivacySettings;
  notifications?: NotificationPreferences;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string | null;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showPhoneNumber: boolean;
  showEmail: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
}

interface NotificationPreferences {
  email: {
    bookingUpdates: boolean;
    promotions: boolean;
    reminders: boolean;
  };
  push: {
    bookingUpdates: boolean;
    promotions: boolean;
    reminders: boolean;
  };
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isUploading: boolean;
  uploadProgress: number;
  securitySettings: SecuritySettings;
  privacySettings: PrivacySettings;
  notificationPreferences: NotificationPreferences;
}

// Async thunks
export const getProfile = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk<UserProfile, Partial<UserProfile>, { rejectValue: string }>(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const uploadProfilePicture = createAsyncThunk<{ profilePicture: string }, string, { rejectValue: string }>(
  'user/uploadProfilePicture',
  async (imageUri, { rejectWithValue }) => {
    try {
      const response = await userService.uploadProfilePicture(imageUri);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload profile picture');
    }
  }
);

export const deleteProfilePicture = createAsyncThunk<null, void, { rejectValue: string }>(
  'user/deleteProfilePicture',
  async (_, { rejectWithValue }) => {
    try {
      await userService.deleteProfilePicture();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete profile picture');
    }
  }
);

export const changePassword = createAsyncThunk<void, { currentPassword: string, newPassword: string }, { rejectValue: string }>(
  'user/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await userService.changePassword(currentPassword, newPassword);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

export const updateSecuritySettings = createAsyncThunk<SecuritySettings, SecuritySettings, { rejectValue: string }>(
  'user/updateSecuritySettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await userService.updateSecuritySettings(settings);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update security settings');
    }
  }
);

export const updatePrivacySettings = createAsyncThunk<PrivacySettings, PrivacySettings, { rejectValue: string }>(
  'user/updatePrivacySettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await userService.updatePrivacySettings(settings);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update privacy settings');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk<NotificationPreferences, NotificationPreferences, { rejectValue: string }>(
  'user/updateNotificationPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await userService.updateNotificationPreferences(preferences);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update notification preferences');
    }
  }
);

export const deleteAccount = createAsyncThunk<boolean, { password: string, confirmationText: string }, { rejectValue: string }>(
  'user/deleteAccount',
  async ({ password, confirmationText }, { rejectWithValue }) => {
    try {
      await userService.deleteAccount(password, confirmationText);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
    }
  }
);

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  isUploading: false,
  uploadProgress: 0,
  securitySettings: {
    twoFactorEnabled: false,
    lastPasswordChange: null,
  },
  privacySettings: {
    profileVisibility: 'public',
    showPhoneNumber: true,
    showEmail: false,
    dataProcessingConsent: true,
    marketingConsent: false,
  },
  notificationPreferences: {
    email: {
      bookingUpdates: true,
      promotions: false,
      reminders: true,
    },
    push: {
      bookingUpdates: true,
      promotions: false,
      reminders: true,
    },
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    resetUploadState: (state) => {
      state.isUploading = false;
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
        if (action.payload.security) {
          state.securitySettings = action.payload.security;
        }
        if (action.payload.privacy) {
          state.privacySettings = action.payload.privacy;
        }
        if (action.payload.notifications) {
          state.notificationPreferences = action.payload.notifications;
        }
      })
      .addCase(getProfile.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch profile';
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update profile';
      });

    // Upload Profile Picture
    builder
      .addCase(uploadProfilePicture.pending, (state) => {
        state.isUploading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action: PayloadAction<{ profilePicture: string }>) => {
        state.isUploading = false;
        state.uploadProgress = 100;
        if (state.profile) {
          state.profile.profilePicture = action.payload.profilePicture;
        }
      })
      .addCase(uploadProfilePicture.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload ?? 'Failed to upload profile picture';
      });

    // Delete Profile Picture
    builder
      .addCase(deleteProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProfilePicture.fulfilled, (state) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.profilePicture = null;
        }
      })
      .addCase(deleteProfilePicture.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete profile picture';
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.securitySettings.lastPasswordChange = new Date().toISOString();
      })
      .addCase(changePassword.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to change password';
      });

    // Update Security Settings
    builder
      .addCase(updateSecuritySettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSecuritySettings.fulfilled, (state, action: PayloadAction<SecuritySettings>) => {
        state.isLoading = false;
        state.securitySettings = { ...state.securitySettings, ...action.payload };
      })
      .addCase(updateSecuritySettings.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update security settings';
      });

    // Update Privacy Settings
    builder
      .addCase(updatePrivacySettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePrivacySettings.fulfilled, (state, action: PayloadAction<PrivacySettings>) => {
        state.isLoading = false;
        state.privacySettings = { ...state.privacySettings, ...action.payload };
      })
      .addCase(updatePrivacySettings.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update privacy settings';
      });

    // Update Notification Preferences
    builder
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action: PayloadAction<NotificationPreferences>) => {
        state.isLoading = false;
        state.notificationPreferences = { ...state.notificationPreferences, ...action.payload };
      })
      .addCase(updateNotificationPreferences.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update notification preferences';
      });

    // Delete Account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        // Account deleted - reset state
        return initialState;
      })
      .addCase(deleteAccount.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete account';
      });
  },
});

export const { clearError, setUploadProgress, resetUploadState } = userSlice.actions;
export default userSlice.reducer;
