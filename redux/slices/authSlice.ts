// src/redux/slices/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveToken, getToken, removeToken } from "../../utils/storage";
import api from "../../api"; // Import the API instance
import { RootState } from "../store";

import authService from '../../services/authServices';
import { auth } from '../../config/firebase';

// Types for user data and state
interface UserInfo {
  name: string;
  email: string;
  phone: string;
  userType: "devotee" | "priest";
  token?: string; // Firebase IDs are dynamic, this might be optional now
  firebaseUid?: string;
  profileCompleted?: boolean;
  _id?: string;
  profilePicture?: {
    publicId?: string;
    url?: string;
  };
  rating?: {
    average: number;
    count: number;
  };
}

interface AuthState {
  userInfo: UserInfo | null;
  userToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// Login user
interface LoginParams {
  identifier: string;
  password: string;
  userType?: "devotee" | "priest";
}

export const login = createAsyncThunk<
  UserInfo,
  LoginParams,
  { rejectValue: string }
>("auth/login", async ({ identifier, password }, { rejectWithValue }) => {
  try {
    const data = await authService.login(identifier, password);
    return data;
  } catch (error: any) {
    console.error("Login Error Details:", error);
    return rejectWithValue(typeof error === 'string' ? error : error.message || "An error occurred during login.");
  }
});

// Firebase Login (Legacy wrapper, now everything is firebase sync)
interface FirebaseLoginParams {
  idToken: string;
  userType?: "devotee" | "priest";
}

export const firebaseLogin = createAsyncThunk<
  UserInfo,
  FirebaseLoginParams,
  { rejectValue: string }
>("auth/firebaseLogin", async ({ idToken, userType }, { rejectWithValue }) => {
  try {
    // If they explicitly pass a token (e.g., from an external Google Login button)
    const response = await api.post("/api/auth/sync", { userType });
    await saveToken("userInfo", JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || "Firebase sync failed");
  }
});

// Register user
interface RegisterParams {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: "devotee" | "priest";
  languagesSpoken?: string[];
}

export const register = createAsyncThunk<
  UserInfo,
  RegisterParams,
  { rejectValue: string }
>(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      return data;
    } catch (error: any) {
      console.error("Registration Error Details:", error);
      return rejectWithValue(typeof error === 'string' ? error : error.message || "An error occurred during registration.");
    }
  }
);

// Load user info from AsyncStorage and validate with server
export const loadUser = createAsyncThunk<
  UserInfo,
  void,
  { rejectValue: string }
>("auth/loadUser", async (_, { rejectWithValue }) => {
  try {
    const userInfoStr = await getToken("userInfo");

    if (!userInfoStr && !auth.currentUser) {
      return rejectWithValue("No cached user info found");
    }

    // Call profile endpoint to ensure valid session and fresh data
    try {
      // The interceptor automatically attaches the Firebase Token
      const response = await api.get("/api/users/profile");
      const userData = response.data.data || response.data;
      
      const userInfo = { ...(userInfoStr ? JSON.parse(userInfoStr) : {}), ...userData };
      await saveToken("userInfo", JSON.stringify(userInfo));
      
      return userInfo;
    } catch (apiError: any) {
      console.error("Server token validation failed:", apiError.message);
      
      if (apiError.response?.status === 401) {
        await authService.logout();
        return rejectWithValue("Session expired. Please login again.");
      }
      
      return userInfoStr ? JSON.parse(userInfoStr) : rejectWithValue("Network Error");
    }
  } catch (error: any) {
    console.error("Failed to load user info:", error);
    return rejectWithValue("Failed to load user info");
  }
});


// Update profile
interface UpdateProfileParams {
  name?: string;
  email?: string;
  phone?: string;
  languagesSpoken?: string[];
  password?: string;
  userType?: "devotee" | "priest";
  profileCompleted?: boolean;
  profilePicture?: {
    url: string;
    publicId?: string;
  };
}

export const updateUserProfile = createAsyncThunk<
  UserInfo,
  UpdateProfileParams,
  { rejectValue: string }
>("auth/updateUserProfile", async (profileData, { rejectWithValue, getState }) => {
  try {
    const state = getState() as RootState;
    // Get the auth token from state
    const { userToken } = state.auth;

    if (!userToken) {
      return rejectWithValue("Authentication required");
    }

    // Use the user profile endpoint for user-level data (name, email, phone, languages)
    const endpoint = "/api/users/profile";

    // Make API call to update profile
    const response = await api.put(endpoint, profileData, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

      // Update AsyncStorage
      const userInfoStr = await getToken("userInfo");
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        
        // Handle inconsistent API responses (flat vs nested in data property)
        const newData = (response.data && response.data.data) ? response.data.data : response.data;
        
        const updatedUserInfo = { ...userInfo, ...newData };

        // Make sure profileCompleted is explicitly set
        if (profileData.profileCompleted !== undefined) {
          updatedUserInfo.profileCompleted = profileData.profileCompleted;
        }

        // Optimize storage: convert populated languages back to IDs to save space
        // SecureStore has a 2KB limit on Android
        const storageUserInfo = { ...updatedUserInfo };
        if (storageUserInfo.languagesSpoken && 
            Array.isArray(storageUserInfo.languagesSpoken) && 
            storageUserInfo.languagesSpoken.length > 0 && 
            typeof storageUserInfo.languagesSpoken[0] === 'object') {
          // @ts-ignore
          storageUserInfo.languagesSpoken = storageUserInfo.languagesSpoken.map(l => l._id);
        }

        await saveToken(
          "userInfo",
          JSON.stringify(storageUserInfo)
        );
      }
      
      // Return the correct payload to the reducer (keep populated data for Redux/UI)
      return (response.data && response.data.data) ? response.data.data : response.data;
  } catch (error: any) {
    console.error("Profile update error:", error);

    let errorMessage = "Failed to update profile.";

    if (error.response) {
      errorMessage =
        error.response.data.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage =
        "Unable to reach the server. Please check your internet connection.";
    } else {
      errorMessage = `Request error: ${error.message}`;
    }

    return rejectWithValue(errorMessage);
  }
});

// Logout user
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await removeToken("userToken");
      await removeToken("userInfo");
      return;
    } catch (error: any) {
      console.error("Logout error:", error);
      return rejectWithValue("Failed to logout properly");
    }
  }
);

// Initial state
const initialState: AuthState = {
  userInfo: null,
  userToken: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProfileCompleted: (state, action: PayloadAction<boolean>) => {
      if (state.userInfo) {
        state.userInfo.profileCompleted = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<UserInfo>) => {
        state.isLoading = false;
        state.userInfo = action.payload;
        state.userToken = action.payload.token || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || "Login failed";
      })
      // Firebase Login
      .addCase(firebaseLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(firebaseLogin.fulfilled, (state, action: PayloadAction<UserInfo>) => {
        state.isLoading = false;
        state.userInfo = action.payload;
        state.userToken = action.payload.token || null;
      })
      .addCase(firebaseLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || "Firebase login failed";
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<UserInfo>) => {
        state.isLoading = false;
        state.userInfo = action.payload;
        state.userToken = action.payload.token || null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || "Registration failed";
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action: PayloadAction<UserInfo>) => {
        state.isLoading = false;
        state.userInfo = action.payload;
        state.userToken = action.payload.token || null;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.userInfo = null;
        state.userToken = null;
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<UserInfo>) => {
          state.isLoading = false;
          state.userInfo = { ...state.userInfo, ...action.payload };

          // Ensure profileCompleted flag is properly set
          if (action.payload.profileCompleted !== undefined) {
            state.userInfo.profileCompleted = action.payload.profileCompleted;
          }
        }
      )
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || "Profile update failed";
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.userInfo = null;
        state.userToken = null;
      });
  },
});

export const { clearError, setProfileCompleted } = authSlice.actions;
export default authSlice.reducer;
