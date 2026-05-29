import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState } from '@/redux/store';
import { setActiveSection, setCreatedBooking } from '@/redux/slices/bookingSlice';
import * as bookingService from '@/services/devotee/bookingService';
import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { formatDisplayDate, formatTime12Hour } from '@/utils/bookingUtils';
import { AssetService } from '@/services/assets/AssetService';

function DetailRow({ 
  iconName, 
  text, 
  onChange 
}: { 
  iconName: keyof typeof Ionicons.glyphMap; 
  text: string; 
  onChange?: () => void; 
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={iconName} size={20} color={THEME.colors.primary} />
      <Text style={styles.detailText} numberOfLines={2}>{text}</Text>
      {onChange && (
        <TouchableOpacity onPress={onChange} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Text style={styles.changeText}>Change →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PriceRow({ label, amount, isBold }: { label: string; amount: string; isBold?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, isBold && styles.boldText]}>{label}</Text>
      <Text style={[styles.priceAmount, isBold && styles.boldText, isBold && styles.goldText]}>{amount}</Text>
    </View>
  );
}

export default function BookingSummaryScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const draft = useSelector((state: RootState) => state.booking);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBackToSection = (section: 'service' | 'date' | 'time' | 'address') => {
    dispatch(setActiveSection(section));
    router.back();
  };

  const handleConfirmAndPay = async () => {
    if (!draft.priestProfileId || !draft.selectedService || !draft.selectedDate || !draft.selectedTimeSlot || !draft.selectedAddress) {
      Alert.alert('Missing Details', 'Please complete all fields before booking.');
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await bookingService.createBooking(draft);

      const order = await bookingService.createPaymentOrder(booking._id, draft.pricing?.totalAmount || 0);

      dispatch(setCreatedBooking({
        bookingId: booking._id,
        razorpayOrderId: order.id,
        bookingReference: booking.paymentDetails?.receiptNumber || `SC-${order.id.slice(-6).toUpperCase()}`,
      }));

      router.push({
        pathname: '/devotee/(screens)/Payment' as any,
        params: {
          bookingId: booking._id,
          razorpayOrderId: order.id,
          amount: order.amount.toString(),
          totalDisplay: draft.pricing.totalAmount.toString(),
        }
      });
    } catch (error: any) {
      Alert.alert('Booking Error', error.message || 'Failed to initialize booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarSource = draft.priestProfilePicture 
    ? { uri: draft.priestProfilePicture }
    : AssetService.getImage('shared.avatarPlaceholder');

  const formattedTime = draft.selectedTimeSlot 
    ? `${draft.selectedTimeSlot.displayLabel} - ${formatTime12Hour(draft.selectedTimeSlot.endTime)}` 
    : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Priest Card */}
        <View style={styles.card}>
          <View style={styles.priestRow}>
            <Image source={avatarSource as any} style={styles.avatar} />
            <View style={styles.priestInfo}>
              <Text style={styles.priestName}>{draft.priestName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={THEME.colors.gold} />
                <Text style={styles.ratingText}>
                  {draft.priestRating ? draft.priestRating.toFixed(1) : 'New'} · Verified ✓
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ceremony Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Puja Details</Text>
          <DetailRow 
            iconName="list" 
            text={draft.selectedService?.ceremonyName || ''} 
            onChange={() => handleBackToSection('service')} 
          />
          <DetailRow 
            iconName="calendar" 
            text={formatDisplayDate(draft.selectedDate || '')} 
            onChange={() => handleBackToSection('date')} 
          />
          <DetailRow 
            iconName="time" 
            text={formattedTime} 
            onChange={() => handleBackToSection('time')} 
          />
          <DetailRow 
            iconName="location" 
            text={draft.selectedAddress?.fullAddress || ''} 
            onChange={() => handleBackToSection('address')} 
          />
        </View>

        {/* Price Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Pricing Details</Text>
          <PriceRow 
            label="Base Price" 
            amount={`₹${(draft.selectedService?.basePrice || 0).toLocaleString('en-IN')}`} 
          />
          <PriceRow 
            label={`Platform fee (${draft.pricing?.feePercentageLabel || '5%'})`} 
            amount={`₹${(draft.pricing?.platformFee || 0).toLocaleString('en-IN')}`} 
          />
          <View style={styles.divider} />
          <PriceRow 
            label="Total Amount" 
            amount={`₹${(draft.pricing?.totalAmount || 0).toLocaleString('en-IN')}`} 
            isBold 
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton 
          title={isSubmitting ? "Processing..." : "Confirm & Pay"} 
          onPress={handleConfirmAndPay}
          loading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: THEME.spacing.md, paddingVertical: THEME.spacing.sm, backgroundColor: THEME.colors.surface, borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  backButton: { padding: 4 },
  headerTitle: { fontSize: THEME.typography.subheading, fontWeight: '600', color: THEME.colors.textPrimary },
  headerRightPlaceholder: { width: 32 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: THEME.colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, ...THEME.shadow.card },
  priestRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: THEME.colors.border },
  priestInfo: { marginLeft: 16, flex: 1 },
  priestName: { fontSize: THEME.typography.subheading, fontWeight: '700', color: THEME.colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textSecondary, marginLeft: 4 },
  cardSectionTitle: { fontSize: 15, fontWeight: '600', color: THEME.colors.textMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailText: { flex: 1, fontSize: THEME.typography.body, color: THEME.colors.textPrimary, marginLeft: 12 },
  changeText: { fontSize: THEME.typography.bodySmall, fontWeight: '600', color: THEME.colors.primary, marginLeft: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: THEME.typography.body, color: THEME.colors.textSecondary },
  priceAmount: { fontSize: THEME.typography.body, color: THEME.colors.textPrimary, fontWeight: '500' },
  boldText: { fontWeight: '700', color: THEME.colors.textPrimary },
  goldText: { color: THEME.colors.gold },
  divider: { height: 1, backgroundColor: THEME.colors.border, marginVertical: 12 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: THEME.colors.surface, borderTopWidth: 1, borderTopColor: THEME.colors.border },
});
