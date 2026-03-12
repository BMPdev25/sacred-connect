import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { APP_COLORS } from '../constants/Colors';
import priestService from '../services/priestService';

const { width } = Dimensions.get('window');

interface IncomingRequestModalProps {
  visible: boolean;
  request: any;
  onAccept: (bookingId: string) => void;
  onDecline: () => void;
  onClose: () => void;
}

export default function IncomingRequestModal({
  visible,
  request,
  onAccept,
  onDecline,
  onClose,
}: IncomingRequestModalProps) {
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute to accept
  const [loading, setLoading] = useState(false);
  const progressAnim = new Animated.Value(1);

  useEffect(() => {
    if (visible) {
      setTimeLeft(60);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 60000,
        useNativeDriver: false,
      }).start();

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [visible]);

  if (!request) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(request.bookingId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="flash" size={14} color={APP_COLORS.white} />
              <Text style={styles.badgeText}>INSTANT REQUEST</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={APP_COLORS.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.ceremonyName}>{request.ceremonyType}</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={APP_COLORS.primary} />
              <Text style={styles.infoText}>{request.devoteeName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={APP_COLORS.primary} />
              <Text style={styles.infoText} numberOfLines={2}>{request.address}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={APP_COLORS.primary} />
              <Text style={styles.infoText}>Available Now</Text>
            </View>
            
            <View style={styles.timerBarContainer}>
                 <Animated.View 
                    style={[
                        styles.timerBar, 
                        { 
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            }),
                            backgroundColor: timeLeft < 10 ? APP_COLORS.error : APP_COLORS.primary
                        }
                    ]} 
                />
            </View>
            <Text style={styles.timerText}>Accept within {timeLeft}s</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.btn, styles.declineBtn]} 
              onPress={onDecline}
              disabled={loading}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.acceptBtn]} 
              onPress={handleAccept}
              disabled={loading}
            >
              <Text style={styles.acceptBtnText}>{loading ? 'Accepting...' : 'Accept Now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  container: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: APP_COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    marginBottom: 24,
  },
  ceremonyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: APP_COLORS.bodyText,
    flex: 1,
  },
  timerBarContainer: {
    height: 4,
    backgroundColor: APP_COLORS.lightGray,
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
  },
  timerText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: APP_COLORS.gray,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: APP_COLORS.primary,
  },
  acceptBtnText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineBtn: {
    backgroundColor: APP_COLORS.lightGray,
  },
  declineBtnText: {
    color: APP_COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
});
