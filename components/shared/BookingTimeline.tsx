import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

type StepState = 'completed' | 'active' | 'pending' | 'error';

interface BookingTimelineProps {
  /** The current status string of the booking. */
  status: string;
}

/**
 * Computes step status states for the 4 timeline milestones.
 *
 * @param status - Current status of the booking.
 * @returns Array of StepStates for [Booked, Confirmed, In Progress, Completed].
 */
function determineStepStates(status: string): StepState[] {
  switch (status) {
    case 'pending':
      return ['active', 'pending', 'pending', 'pending'];
    case 'confirmed':
    case 'arrived':
      return ['completed', 'active', 'pending', 'pending'];
    case 'in_progress':
      return ['completed', 'completed', 'active', 'pending'];
    case 'completed':
      return ['completed', 'completed', 'completed', 'completed'];
    case 'cancelled':
    case 'rejected':
      return ['completed', 'completed', 'error', 'pending'];
    default:
      return ['pending', 'pending', 'pending', 'pending'];
  }
}

/**
 * Renders an individual timeline node with standard color styling.
 */
function TimelineStep({ label, state }: { label: string; state: StepState }): React.JSX.Element {
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
    if (state === 'completed') return <Ionicons name="checkmark" size={16} color="#FFF" />;
    if (state === 'error') return <Ionicons name="close" size={16} color="#FFF" />;
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

/**
 * A horizontal timeline component illustrating booking milestone progression.
 */
export default function BookingTimeline({ status }: BookingTimelineProps): React.JSX.Element {
  const labels = ['Booked', 'Confirmed', 'In Progress', 'Completed'];
  const states = determineStepStates(status);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Status Timeline</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  title: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
    width: 8,
    height: 8,
    borderRadius: 4,
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
    marginTop: 13,
    marginHorizontal: -12,
    zIndex: -1,
  },
  lineActive: {
    backgroundColor: THEME.colors.primary,
  },
  linePending: {
    backgroundColor: THEME.colors.border,
  },
});
