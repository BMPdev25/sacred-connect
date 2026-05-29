import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { PublicPriestProfile } from '@/types/priestDetails.types';
import { formatDuration } from '@/utils/priestDetailsUtils';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export interface ServicesSectionProps {
  services: PublicPriestProfile['services'];
  priestProfileId: string;
  onBookService: (serviceId: string, ceremonyName: string) => void;
}

function ServiceItem({ service, onBook }: { service: PublicPriestProfile['services'][0], onBook: () => void }) {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.ceremonyId?.name || 'Ceremony'}</Text>
        <View style={styles.serviceMetaRow}>
          <Ionicons name="time-outline" size={14} color={THEME.colors.textMuted} style={styles.metaIcon} />
          <Text style={styles.serviceMetaText}>{formatDuration(service.durationMinutes)}</Text>
        </View>
      </View>
      
      <View style={styles.serviceRight}>
        <Text style={styles.servicePrice}>₹{service.price.toLocaleString('en-IN')}</Text>
        <PrimaryButton 
          title="Book" 
          onPress={onBook} 
          style={styles.bookButton} 
          variant="outline"
        />
      </View>
    </View>
  );
}

export function ServicesSection({ services, onBookService }: ServicesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!services || services.length === 0) return null;
  
  const initialCount = 4;
  const hasMore = services.length > initialCount;
  const visibleServices = expanded ? services : services.slice(0, initialCount);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Services Provided</Text>
      
      <View style={styles.list}>
        {visibleServices.map(service => (
          <ServiceItem 
            key={service._id} 
            service={service} 
            onBook={() => onBookService(service._id, service.ceremonyId?.name || 'Ceremony')} 
          />
        ))}
      </View>

      {hasMore && !expanded && (
        <Pressable onPress={() => setExpanded(true)} style={styles.expandButton}>
          <Text style={styles.expandText}>View {services.length - initialCount} more</Text>
          <Ionicons name="chevron-down" size={16} color={THEME.colors.primary} style={styles.expandIcon} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  list: {
    gap: THEME.spacing.sm,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...THEME.shadow.card,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 16,
  },
  serviceName: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  serviceMetaText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  serviceRight: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.gold,
    marginBottom: 8,
  },
  bookButton: {
    height: 32,
    width: 80,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  expandText: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  expandIcon: {
    marginLeft: 4,
  },
});
