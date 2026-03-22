// src/redux/slices/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveToken, getToken, removeToken } from "../../utils/storage";
import api from "../../api"; // Import the API instance
import { RootState } from "../store";

// Types for user data and state
interface UserInfo {
  name: string;
  email: string;
  phone: string;
  userType: "devotee" | "priest";
  token: string;
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
>("auth/login", async ({ identifier, password, userType }, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/auth/login", {
      identifier,
      password,
      userType
    });

    // Store token in SecureStore
    await saveToken("userToken", response.data.token);
    // Ensure _id is present in userInfo for future use
    const userInfoToStore = response.data._id
      ? { ...response.data, _id: response.data._id }
      : response.data;
    await saveToken("userInfo", JSON.stringify(userInfoToStore));
    
    return response.data;
  } catch (error: any) {
    // Production Rule 3: Log specific error for debugging
    console.error("Login Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Create a user-friendly error message
    let errorMessage = "An error occurred during login.";

    if (error.response) {
      errorMessage =
        error.response.data.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage =
        "Unable to reach the server. Please check your internet connection and make sure the server is running.";
    } else {
      errorMessage = `Request error: ${error.message}`;
    }

    return rejectWithValue(errorMessage);
  }
});

// Firebase Login
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
    const response = await api.post("/api/auth/firebase-login", {
      idToken,
      userType
    });

    // Store token in SecureStore
    await saveToken("userToken", response.data.token);
    // Ensure _id is present in userInfo for future use
    const userInfoToStore = response.data._id
      ? { ...response.data, _id: response.data._id }
      : response.data;
    await saveToken("userInfo", JSON.stringify(userInfoToStore));
    
    return response.data;
  } catch (error: any) {
    // Production Rule 3: Log specific error for debugging
    console.error("Firebase Login Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Create a user-friendly error message
    let errorMessage = "An error occurred during login.";

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
  async (
    { name, email, phone, password, userType, languagesSpoken },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/api/auth/register", {
        name,
        email,
        phone,
        password,
        userType,
        languagesSpoken,
      });

      // Store token in SecureStore
      await saveToken("userToken", response.data.token);
      // Ensure _id is present in userInfo for future use
      const userInfoToStore = response.data._id
        ? { ...response.data, _id: response.data._id }
        : response.data;
      await saveToken(
        "userInfo",
        JSON.stringify(userInfoToStore)
      );

      return response.data;
    } catch (error: any) {
      // Production Rule 3: Log specific error for debugging
      console.error("Registration Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      let errorMessage = "An error occurred during registration.";

      if (error.response) {
        errorMessage =
          error.response.data.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage =
          "Unable to reach the server. Please check your internet connection and make sure the server is running.";
      } else {
        errorMessage = `Request error: ${error.message}`;
      }

      return rejectWithValue(errorMessage);
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
    const userToken = await getToken("userToken");

    if (!userInfoStr || !userToken) {
      return rejectWithValue("No cached user info found");
    }

    // Production-Ready: Validate token by fetching profile from server
    // This handles the "expired token on app open" edge case
    try {
      const response = await api.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      const userData = response.data.data || response.data;
      const userInfo = { ...JSON.parse(userInfoStr), ...userData, token: userToken };
      
      // Update local storage with fresh data
      await saveToken("userInfo", JSON.stringify(userInfo));
      
      return userInfo;
    } catch (apiError: any) {
      console.error("Server token validation failed:", apiError.message);
      
      // If server check fails with 401, we want to clear storage and reject
      if (apiError.response?.status === 401) {
        await removeToken("userToken");
        await removeToken("userInfo");
        return rejectWithValue("Session expired. Please login again.");
      }
      
      // For generic network errors, fallback to cached data if it exists
      // as the user might be offline but still has a valid (not yet expired) token
      return { ...JSON.parse(userInfoStr), token: userToken };
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
        state.userToken = action.payload.token;
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
        state.userToken = action.payload.token;
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
        state.userToken = action.payload.token;
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
        state.userToken = action.payload.token;
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
