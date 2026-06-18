import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import {
  LAST_UPDATED,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
} from '@/constants/legalData';

/**
 * TermsPrivacy Screen.
 * Dynamically displays the Terms of Service or Privacy Policy copy
 * based on the 'type' route search parameter.
 */
export default function TermsPrivacy(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'terms' | 'privacy' }>();

  const isTerms = type !== 'privacy';
  const headerTitle = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + THEME.spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, idx) => (
          <View key={idx} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.content}</Text>
          </View>
        ))}

        <Text style={styles.lastUpdatedText}>{LAST_UPDATED}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerContainer: {
    height: 56,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    zIndex: 10,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 8,
    padding: 8,
    zIndex: 12,
  },
  titleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  headerTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
  },
  sectionContainer: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  sectionBody: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
  },
  lastUpdatedText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
  },
});
