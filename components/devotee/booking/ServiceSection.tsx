import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { setActiveSection, setSelectedService } from '@/redux/slices/bookingSlice';
import { usePriestProfile } from '@/hooks/usePriestDetails';

interface ServiceSectionProps {
  priestProfileId: string;
}

/**
 * ServiceSection displays either the completed selected service or a list of available
 * services for the devotee to pick from.
 */
export function ServiceSection({ priestProfileId }: ServiceSectionProps) {
  const dispatch = useDispatch();
  const draft = useSelector((state: RootState) => state.booking);
  
  const { data: priest } = usePriestProfile(priestProfileId);

  // Render the expanded service picker list
  if (draft.activeSection === 'service') {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelActive}>SELECT SERVICE</Text>
        {priest?.services?.map((service, index) => (
          <TouchableOpacity
            key={service._id ?? index}
            style={styles.pickerCard}
            onPress={() =>
              dispatch(
                setSelectedService({
                  serviceId: service._id,
                  ceremonyId: service.ceremonyId?._id,
                  ceremonyName: service.ceremonyId?.name ?? 'Ceremony',
                  durationMinutes: service.durationMinutes,
                  basePrice: service.price,
                })
              )
            }
          >
            <View style={styles.pickerRow}>
              <Text style={styles.serviceName}>{service.ceremonyId?.name ?? 'Ceremony'}</Text>
              <Text style={styles.servicePrice}>₹{service.price}</Text>
            </View>
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={14} color={THEME.colors.textSecondary} />
              <Text style={styles.durationText}>{service.durationMinutes} mins</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Render the collapsed completed state if a service is selected
  if (draft.selectedService) {
    const { ceremonyName, basePrice, durationMinutes } = draft.selectedService;
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelCompleted}>SERVICE</Text>
        <View style={styles.completedCard}>
          <TouchableOpacity 
            style={styles.changeLink} 
            onPress={() => dispatch(setActiveSection('service'))}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
          
          <View style={styles.pickerRow}>
            <Text style={styles.serviceName}>{ceremonyName}</Text>
            <Text style={styles.servicePrice}>₹{basePrice}</Text>
          </View>
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={14} color={THEME.colors.textSecondary} />
            <Text style={styles.durationText}>{durationMinutes} mins</Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.xl,
  },
  sectionLabelActive: {
    fontSize: THEME.typography.caption,
    textTransform: 'uppercase',
    color: THEME.colors.primary,
    letterSpacing: 1.5,
    marginBottom: THEME.spacing.sm,
    fontWeight: '600',
  },
  sectionLabelCompleted: {
    fontSize: THEME.typography.caption,
    textTransform: 'uppercase',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: THEME.spacing.sm,
    fontWeight: '600',
  },
  pickerCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    marginBottom: 8,
    ...THEME.shadow.card,
  },
  completedCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.primary,
    ...THEME.shadow.card,
    position: 'relative',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 40, // Space for the "Change" link in completed state
  },
  serviceName: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  servicePrice: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.gold,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  durationText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginLeft: 4,
  },
  changeLink: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  changeText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textDecorationLine: 'underline',
  },
});
