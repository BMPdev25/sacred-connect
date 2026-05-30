import React, { useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { FAQ_ITEMS } from '@/constants/faqData';
import { FAQRow } from '@/components/devotee/profile/FAQRow';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * HelpSupport Screen.
 * Renders support email/WhatsApp buttons and collapsible frequently asked questions (FAQs).
 */
export default function HelpSupport(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    LayoutAnimation.easeInEaseOut();
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleEmail = async () => {
    const url = 'mailto:support@sacredconnect.in';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Email Unavailable', 'No email client configured on this device.');
      }
    } catch {
      Alert.alert('Email Unavailable', 'Could not open email application.');
    }
  };

  const handleWhatsApp = async () => {
    const url = 'https://wa.me/918000000000';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('WhatsApp Unavailable', 'WhatsApp application is not installed on this device.');
      }
    } catch {
      Alert.alert('WhatsApp Unavailable', 'Could not open WhatsApp application.');
    }
  };

  const renderContactCards = () => (
    <View style={styles.contactRow}>
      <TouchableOpacity
        onPress={handleEmail}
        activeOpacity={0.8}
        style={styles.contactCard}
      >
        <Ionicons name="mail-outline" size={28} color={THEME.colors.primary} />
        <Text style={styles.contactCardTitle}>Email Us</Text>
        <Text style={styles.contactCardValue}>support@sacredconnect.in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleWhatsApp}
        activeOpacity={0.8}
        style={styles.contactCard}
      >
        <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
        <Text style={styles.contactCardTitle}>WhatsApp</Text>
        <Text style={styles.contactCardValue}>+91 80000 00000</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ABSOLUTE NAVIGATION HEADER */}
      <View style={[styles.headerContainer, { top: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + THEME.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* CONTACT US SECTION */}
        <Text style={styles.sectionHeading}>Contact Us</Text>
        {renderContactCards()}
        <Text style={styles.responseCaption}>Typically responds within 2 hours</Text>

        {/* FAQ SECTION */}
        <Text style={[styles.sectionHeading, styles.faqMargin]}>
          Frequently Asked Questions
        </Text>
        <View style={styles.faqCard}>
          {FAQ_ITEMS.map((item, index) => (
            <FAQRow
              key={item.id}
              item={item}
              isOpen={openFaqId === item.id}
              onToggle={() => handleToggle(item.id)}
              isLast={index === FAQ_ITEMS.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    position: 'relative',
  },
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
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
  sectionHeading: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  contactCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.card,
  },
  contactCardTitle: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.xs,
  },
  contactCardValue: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  responseCaption: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
  },
  faqMargin: {
    marginTop: THEME.spacing.xl,
  },
  faqCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
    ...THEME.shadow.card,
    marginBottom: THEME.spacing.md,
  },
});
