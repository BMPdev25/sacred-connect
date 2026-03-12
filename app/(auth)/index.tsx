import { router } from "expo-router";
import * as SecureStore from "../../utils/storage";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { APP_COLORS } from "../../constants/Colors";
import { loadUser } from "../../redux/slices/authSlice";

export default function Authentication() {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userInfoStr = await SecureStore.getItemAsync("userInfo");
        const userToken = await SecureStore.getItemAsync("userToken");

        if (!mounted) return;

        // Check if both userInfo and token exist
        if (userInfoStr && userToken) {
          const userInfo = JSON.parse(userInfoStr);

          // Try to load user data to validate token
          try {
            await dispatch(loadUser() as any);

            // If loadUser succeeds, token is valid - route to appropriate screen
            if (userInfo?.userType === "priest") {
              router.replace("/priest/HomeTab" as any);
              return;
            }
            if (userInfo?.userType === "devotee") {
              router.replace("/devotee/HomeTab" as any);
              return;
            }
          } catch (e: any) {
            // If loadUser fails, clear credentials and go to login
            const errorMessage = e?.message || e?.response?.data?.message || '';
            console.log("Token validation failed - clearing credentials:", errorMessage);

            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("userInfo");

            // If it's a role mismatch error, it means they logged in but with the wrong app type previously.
            // Just drop them to login, the user will see the error when they try to re-authenticate.
            router.replace("/login" as any);
            return;
          }
        }

        // No credentials or incomplete credentials -> go to login
        router.replace("/login" as any);
      } catch (e) {
        console.error("Error checking auth on boot:", e);
        // Clear potentially corrupted credentials
        try {
          await SecureStore.deleteItemAsync("userToken");
          await SecureStore.deleteItemAsync("userInfo");
        } catch (clearError) {
          console.error("Error clearing credentials:", clearError);
        }
        router.replace("/login" as any);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={APP_COLORS.primary} />
      <Text style={styles.text}>Checking authentication...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APP_COLORS.background,
  },
  text: {
    marginTop: 12,
    color: APP_COLORS.gray,
  },
});
