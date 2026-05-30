import { StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  screenTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Scroll content layout
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  declineButton: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: THEME.borderRadius.pill,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: THEME.typography.body,
    color: '#EF4444',
    fontWeight: '600',
  },
  expiryText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  expiredErrorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  centerAlign: { justifyContent: 'center', alignItems: 'center' },
  errorText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.pill,
  },
  retryBtnText: {
    fontSize: THEME.typography.bodySmall,
    color: '#FFF',
    fontWeight: '600',
  },
});
