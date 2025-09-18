import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../config';

const termsText = `Terms and Conditions

Effective Date: 08-07-2025

Welcome to Book My Pujari. By downloading, installing, or using our app, you agree to be bound by the following Terms and Conditions. Please read them carefully.

1. Acceptance of Terms
By accessing or using the Book My Pujari app (“App”), you agree to be legally bound by these Terms and Conditions (“Terms”). If you do not agree to these Terms, please do not use the App.

2. Services Provided
Book My Pujari connects users with professional priests (pujaris) for various religious services and ceremonies. We act solely as an intermediary platform between users and service providers.

3. User Eligibility
You must be at least 18 years old to use this app. By using the app, you represent and warrant that you are eligible and capable of entering into a binding agreement.

4. User Responsibilities
• Provide accurate, current, and complete information.
• Do not use the app for any unlawful or unauthorized purposes.
• Treat priests and other users with respect and dignity.
• You are responsible for all activities under your account.

5. Bookings and Payments
• All bookings are subject to availability and confirmation.
• Payment must be completed as per the pricing shown in the app before confirmation.
• Cancellation policies will be stated clearly in the booking section.

6. Cancellations and Refunds
• Cancellations must be made within the stated time window in the app to be eligible for a refund.
• Refunds are processed as per our refund policy (refer to the Refund Policy section).
• Book My Pujari reserves the right to cancel any booking due to unforeseen circumstances.

7. Service Provider Responsibility
• We are not responsible for the conduct or performance of any priest.
• While we perform basic background checks, service quality is the priest’s responsibility.
• Any dispute must be addressed with the priest directly. We may assist in resolving issues.

8. Prohibited Conduct
You agree not to:
• Misuse the app for fraudulent/malicious purposes.
• Impersonate others.
• Harass or abuse any user or service provider.
• Attempt to hack, reverse-engineer, or tamper with the app.

9. Intellectual Property
All content, design, logos, and trademarks are owned by Book My Pujari. Unauthorized use is strictly prohibited.

10. Limitation of Liability
Book My Pujari is not liable for any direct, indirect, incidental, or consequential damages from use or inability to use the app or services.

11. Privacy
Your data is protected under our Privacy Policy. By using the app, you consent to the collection and use of your data accordingly.

12. Modifications to Terms
We may update these Terms at any time. Continued use of the app indicates your acceptance of updated Terms.

13. Governing Law
These Terms are governed by the laws of Telangana, India. Disputes will be under the exclusive jurisdiction of courts in Hyderabad.

14. Contact Us
If you have any questions regarding these Terms, contact us:

Email: bmpoffice24x7@gmail.com
Phone: +91 89770 02911
Address: Hyderabad, India
`;

const highlightColor = '#000';
const HEADER_TOP_PADDING = Platform.OS === 'android' ? (Platform.constants && Platform.constants.StatusBarHeight) || 24 : 44;

const TermsAndConditionsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
  <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: HEADER_TOP_PADDING, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 4, borderBottomWidth: 1, borderBottomColor: APP_COLORS.lightGray }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
        {termsText.split('\n').map((line, idx) => {
          const trimmed = line.trim();

          if (trimmed === 'Terms and Conditions') {
            return (
              <Text key={idx} style={[styles.termsText, styles.title]}>
                {line}
              </Text>
            );
          }

          if (trimmed.startsWith('Effective Date:')) {
            return (
              <Text key={idx} style={[styles.termsText, styles.effectiveDate]}>
                {line}
              </Text>
            );
          }

          if (/^\d+\./.test(trimmed)) {
            return (
              <Text key={idx} style={[styles.termsText, styles.sectionHeader]}>
                {line}
              </Text>
            );
          }

          if (
            trimmed === '14. Contact Us' ||
            trimmed.toLowerCase().startsWith('contact us')
          ) {
            return (
              <Text key={idx} style={[styles.termsText, styles.sectionHeader]}>
                Contact Us
              </Text>
            );
          }

          if (trimmed.startsWith('Email:')) {
            return (
              <Text key={idx} style={styles.termsText}>
                <Text style={styles.boldLabel}>Email:</Text> bmpoffice24x7@gmail.com
              </Text>
            );
          }

          if (trimmed.startsWith('Phone:')) {
            return (
              <Text key={idx} style={styles.termsText}>
                <Text style={styles.boldLabel}>Phone:</Text> +91 89770 02911
              </Text>
            );
          }

          if (trimmed.startsWith('Address:')) {
            return (
              <Text key={idx} style={styles.termsText}>
                <Text style={styles.boldLabel}>Address:</Text> Hyderabad, India
              </Text>
            );
          }

          if (trimmed.includes('Book My Pujari')) {
            const parts = line.split('Book My Pujari');
            return (
              <Text key={idx} style={styles.termsText}>
                {parts[0]}
                <Text style={{ color: highlightColor, fontWeight: 'bold' }}>
                  Book My Pujari
                </Text>
                {parts[1] || ''}
              </Text>
            );
          }

          return (
            <Text key={idx} style={styles.termsText}>
              {line}
            </Text>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  scroll: {
    flex: 1,
  },
  termsText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
    textAlign: 'left',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: highlightColor,
    marginBottom: 10,
  },
  effectiveDate: {
    fontWeight: '600',
    color: highlightColor,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 16,
    marginTop: 18,
    marginBottom: 4,
    fontWeight: 'bold',
    color: highlightColor,
  },
  boldLabel: {
    fontWeight: 'bold',
    color: highlightColor,
  },
});

export default TermsAndConditionsScreen;
