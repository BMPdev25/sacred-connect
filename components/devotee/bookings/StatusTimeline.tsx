import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { BookingStatus } from '@/types/bookingManagement.types';
import { DetailCard } from './DetailCard';

interface StatusTimelineProps {
  status: BookingStatus;
}

type StepState = 'completed' | 'active' | 'pending' | 'error';

function determineStepStates(status: BookingStatus): StepState[] {
  switch (status) {
    case 'pending':
      return ['active', 'pending', 'pending', 'pending'];
    case 'confirmed':
      return ['completed', 'active', 'pending', 'pending'];
    case 'completed':
      return ['completed', 'completed', 'completed', 'completed'];
    case 'cancelled':
    case 'rejected':
      // The instructions note: 2 steps + red X on next
      return ['completed', 'completed', 'error', 'pending'];
    default:
      return ['pending', 'pending', 'pending', 'pending'];
  }
}

function TimelineStep({ label, state }: { label: string; state: StepState }) {
  const getCircleStyle = () => {
    switch (state) {
      case 'completed':
        return styles.circleCompleted;
      case 'active':
        return styles.circleActive;
      case 'error':
        return styles.circleError;
      default:
        return styles.circlePending;
    }
  };

  const renderIcon = () => {
    if (state === 'completed') return <Ionicons name="checkmark" size={18} color="#FFF" />;
    if (state === 'error') return <Ionicons name="close" size={18} color="#FFF" />;
    if (state === 'active') return <View style={styles.dotActive} />;
    return null;
  };

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.circle, getCircleStyle()]}>{renderIcon()}</View>
      <Text style={styles.stepLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function StatusTimeline({ status }: StatusTimelineProps) {
  const labels = ['Booked', 'Confirmed', 'In Progress', 'Completed'];
  const states = determineStepStates(status);

  return (
    <DetailCard>
      <View style={styles.trackContainer}>
        {labels.map((label, index) => {
          const isLast = index === labels.length - 1;
          const isLineActive = states[index] === 'completed' && states[index + 1] === 'completed';

          return (
            <React.Fragment key={index}>
              <TimelineStep label={label} state={states[index]} />
              {!isLast && (
                <View style={[styles.line, isLineActive ? styles.lineActive : styles.linePending]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  stepContainer: {
    alignItems: 'center',
    width: 60,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  circleCompleted: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  circleActive: {
    backgroundColor: '#FFF',
    borderColor: THEME.colors.primary,
  },
  circleError: {
    backgroundColor: THEME.colors.error,
    borderColor: THEME.colors.error,
  },
  circlePending: {
    backgroundColor: '#FFF',
    borderColor: THEME.colors.border,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.primary,
  },
  stepLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 15,
    marginHorizontal: -10, // Pulls line behind circles visually if layered right, or just tightens gap
    zIndex: -1,
  },
  lineActive: {
    backgroundColor: THEME.colors.primary,
  },
  linePending: {
    backgroundColor: THEME.colors.border,
    borderStyle: 'dashed', // Note: React Native borderStyle dashed works better on borders, but for height 2 view we just use solid grey
  },
});
