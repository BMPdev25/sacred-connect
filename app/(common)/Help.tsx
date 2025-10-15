import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../constants/Colors";

const HelpScreen: React.FC = () => {
  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

            <View style={styles.faqItem}>
              <Text style={styles.question}>
                How do I update my availability?
              </Text>
              <Text style={styles.answer}>
                Go to your Profile {">"} Calendar Settings to update your
                available slots and working hours.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.question}>How do I receive payments?</Text>
              <Text style={styles.answer}>
                Payments are automatically transferred to your registered bank
                account within 24-48 hours after service completion.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.question}>
                What if I need to cancel a booking?
              </Text>
              <Text style={styles.answer}>
                Please notify us at least 24 hours in advance. You can cancel by
                going to the booking details and selecting "Cancel".
              </Text>
            </View>
          </View>

          <View style={styles.supportSection}>
            <Text style={styles.sectionTitle}>Contact Support</Text>

            <TouchableOpacity style={styles.supportItem}>
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={APP_COLORS.primary}
              />
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Live Chat</Text>
                <Text style={styles.supportText}>
                  Our support team is available 24/7
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportItem}>
              <Ionicons
                name="call-outline"
                size={24}
                color={APP_COLORS.primary}
              />
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Call Us</Text>
                <Text style={styles.supportText}>1800-123-4567</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportItem}>
              <Ionicons
                name="mail-outline"
                size={24}
                color={APP_COLORS.primary}
              />
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Email Support</Text>
                <Text style={styles.supportText}>
                  support@sacredconnect.com
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    backgroundColor: APP_COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  answer: {
    fontSize: 14,
    color: APP_COLORS.gray,
    lineHeight: 20,
  },
  supportSection: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
  },
  supportContent: {
    marginLeft: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  supportText: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
});

export default HelpScreen;
