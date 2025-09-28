import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useDispatch } from "react-redux";
import { loadUser } from "../../redux/slices/authSlice";

export default function Authentication() {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem("userInfo");
        if (!mounted) return;

        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          // populate redux auth state from AsyncStorage
          try {
            await dispatch(loadUser() as any);
          } catch (e) {
            // ignore load errors; we'll still route based on stored value
            console.warn("loadUser failed during boot:", e);
          }
          // route based on userType
          if (userInfo?.userType === "priest") {
            router.replace("/priest/HomeTab" as any);
            return;
          }
          if (userInfo?.userType === "devotee") {
            router.replace("/devotee/HomeTab" as any);
            return;
          }
        }

        // not authenticated -> go to login
        router.replace("/login" as any);
      } catch (e) {
        console.error("Error checking auth on boot:", e);
        router.replace("/login" as any);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#666" />
      <Text style={styles.text}>Checking authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: {
    marginTop: 12,
    color: "#666",
  },
});
