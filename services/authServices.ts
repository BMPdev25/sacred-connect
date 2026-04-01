import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { saveToken, getToken, removeToken } from '../utils/storage';
import api from "../api";

/**
 * Service for authentication-related API calls
 */
const authService = {
  /**
   * Login with email/phone and password using Firebase
   */
  login: async (identifier: string, password: string): Promise<any> => {
    try {
      // 1. Authenticate locally with Firebase
      // Note: Identifier is usually email. If you allow phone login via password, it might need Firebase custom auth, 
      // but typically we use email for password login in Firebase Native.
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      
      // 2. API interceptor will now automatically include the new Firebase Token.
      // Call backend to sync profile
      const response = await api.post("/api/auth/sync", { 
         // Send basic info if needed, though backend will look up existing by UID
         identifier 
      });

      await saveToken("userInfo", JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      // Handle Firebase specific Errors cleanly
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
         throw "Invalid credentials. Please check your email and password.";
      }
      throw error?.response?.data?.message || "Login failed. Please try again.";
    }
  },

  /**
   * Register a new user via Firebase
   */
  register: async (userData: Record<string, any>): Promise<any> => {
    try {
      // 1. Register with Firebase using Email/Password
      if (!userData.email || !userData.password) {
         throw new Error("Email and password are required for Firebase registration");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

      // (Optional) Update their Display Name in Firebase
      if (userData.name) {
          await updateProfile(userCredential.user, { displayName: userData.name });
      }

      // 2. API interceptor sends the Firebase token.
      // Send the REST of the profile data to MongoDB via /sync
      const response = await api.post("/api/auth/sync", {
         ...userData
      });

      await saveToken("userInfo", JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
         throw "This email is already registered.";
      }
      throw error?.response?.data?.message || error.message || "Registration failed. Please try again.";
    }
  },

  /**
   * Logout the current user from Firebase & Storage
   */
  logout: async (): Promise<boolean> => {
    try {
      await signOut(auth); // Clear Firebase session
      await removeToken("userToken"); // Cleanup old legacy tokens
      await removeToken("userInfo");
      return true;
    } catch (error: any) {
      throw "Logout failed. Please try again.";
    }
  },

  /**
   * Check if the user is authenticated
   * @returns {Promise<boolean>} Whether the user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await getToken("userToken");
      return !!token;
    } catch (error: any) {
      return false;
    }
  },

  /**
   * Get the current user's info
   * @returns {Promise<Object>} The user info
   */
  getUserInfo: async (): Promise<any | null> => {
    try {
      const userInfo = await getToken("userInfo");
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error: any) {
      return null;
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - The profile data to update
   * @returns {Promise} Response from the API
   */
  updateProfile: async (profileData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put("/api/auth/profile", profileData);

      // Update local storage with updated user info
      const userInfo = await getToken("userInfo");
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        const updatedUserInfo = { ...parsedUserInfo, ...response.data };
        await saveToken(
          "userInfo",
          JSON.stringify(updatedUserInfo)
        );
      }

      return response.data;
    } catch (error: any) {
      throw (
        error?.response?.data?.message ||
        "Profile update failed. Please try again."
      );
    }
  },

  /**
   * Change user password
   * @param {Object} passwordData - The password data (old and new)
   * @returns {Promise} Response from the API
   */
  changePassword: async (passwordData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put("/api/auth/change-password", passwordData);
      return response.data;
    } catch (error: any) {
      throw (
        error?.response?.data?.message ||
        "Password change failed. Please try again."
      );
    }
  },

  /**
   * Request password reset
   * @param {string} phone - The phone number to reset password for
   * @returns {Promise} Response from the API
   */
  requestPasswordReset: async (phone: string): Promise<any> => {
    try {
      const response = await api.post("/api/auth/request-reset", { phone });
      return response.data;
    } catch (error: any) {
      throw (
        error?.response?.data?.message ||
        "Password reset request failed. Please try again."
      );
    }
  },

  /**
   * Reset password with OTP
   * @param {Object} resetData - The reset data (phone, OTP, new password)
   * @returns {Promise} Response from the API
   */
  resetPassword: async (resetData: Record<string, any>): Promise<any> => {
    try {
      const response = await api.post("/api/auth/reset-password", resetData);
      return response.data;
    } catch (error: any) {
      throw (
        error?.response?.data?.message ||
        "Password reset failed. Please try again."
      );
    }
  },

  /**
   * Save Expo Push Token to backend
   * @param {string} pushToken - The device's Expo push token
   * @returns {Promise} Response from the API
   */
  savePushToken: async (pushToken: string): Promise<any> => {
    try {
      const response = await api.post("/api/auth/push-token", { pushToken });
      return response.data;
    } catch (error: any) {
      console.warn("Could not save push token:", error?.response?.data?.message || error.message);
      return null;
    }
  },
};

export default authService;
