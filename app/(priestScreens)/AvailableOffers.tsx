import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../constants/Colors";

const AvailableOffers = () => {
  const { ceremony }: any = {
    ceremony: {
      header: "",
      ceremonyName: "",
      name: "test",
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerInner}>
        <Text style={styles.header}>Available Offers</Text>
        <Text style={styles.ceremonyName}>
          For: {ceremony?.name || "Ceremony"}
        </Text>
        <Text style={styles.placeholder}>
          This is where available offers for this ceremony will be shown.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  containerInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: APP_COLORS.primary,
    marginBottom: 16,
  },
  ceremonyName: {
    fontSize: 18,
    color: APP_COLORS.gray,
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 15,
    color: APP_COLORS.gray,
    textAlign: "center",
  },
});

export default AvailableOffers;
