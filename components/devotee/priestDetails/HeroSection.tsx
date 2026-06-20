import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Share, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { PublicPriestProfile } from '@/types/priestDetails.types';
import { AssetService } from '@/services/assets/AssetService';
import { normalizeProfilePicture } from '@/utils/imageUtils';

interface HeaderControlsProps {
  /** Callback triggered to share priest profile */
  onShare: () => void;
}

/**
 * Top absolute positioned back and share controls.
 */
function HeaderControls({ onShare }: HeaderControlsProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.headerControls, { top: insets.top + 8 }]}>
      <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={onShare}>
        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

interface StatsRowProps {
  ratings: PublicPriestProfile['ratings'];
  experience: number;
  ceremonyCount: number;
}

/**
 * Renders the rating, experience, and ceremonies count statistics.
 */
function StatsRow({ ratings, experience, ceremonyCount }: StatsRowProps) {
  const ratingAverage = ratings?.average?.toFixed(1) ?? '0.0';
  
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <View style={styles.statValueRow}>
          <Ionicons name="star" size={14} color="#F59E0B" style={styles.starIcon} />
          <Text style={styles.statValue}>{ratingAverage}</Text>
        </View>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{experience} yrs</Text>
        <Text style={styles.statLabel}>Experience</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{ceremonyCount.toString()}</Text>
        <Text style={styles.statLabel}>Ceremonies</Text>
      </View>
    </View>
  );
}

/**
 * Displays priest circular avatar with an online status indicator.
 */
function AvatarWithBadge({ priest }: { priest: PublicPriestProfile }) {
  const avatarPlaceholder = AssetService.getImage('shared.avatarPlaceholder');
  const hasProfilePic = Boolean(priest.profilePicture);
  
  return (
    <View style={styles.avatarContainer}>
      <Image
        source={hasProfilePic ? { uri: priest.profilePicture } : avatarPlaceholder}
        style={styles.avatar}
      />
      {priest.currentAvailability?.status === 'available' && (
        <View style={styles.onlineDot} />
      )}
    </View>
  );
}

interface HeroSectionProps {
  priest: PublicPriestProfile;
}

/**
 * The main immersive Hero section showing background image, gradient, and priest details.
 */
export function HeroSection({ priest }: HeroSectionProps) {
  const onShare = async () => {
    try {
      await Share.share({ message: `${priest.name} on Sacred Connect` });
    } catch (error) {
      console.error(error);
    }
  };
  
  const specialization = priest.specializations?.[0]?.name ?? priest.religiousTradition;
  const priestPicUrl = normalizeProfilePicture(priest.profilePicture);

  return (
    <View style={styles.heroContainer}>
      {priestPicUrl ? (
        <ImageBackground
          source={{ uri: priestPicUrl }}
          style={styles.background}
          resizeMode="cover"
          blurRadius={10}
        />
      ) : (
        <LinearGradient 
          colors={['#FF9933', '#800000']} 
          style={styles.background} 
        />
      )}
      <LinearGradient 
        colors={['transparent', 'rgba(0,0,0,0.75)']} 
        style={styles.overlay} 
      />
      
      <HeaderControls onShare={onShare} />
      
      <View style={styles.content}>
        <AvatarWithBadge priest={priest} />
        <Text style={styles.name}>{priest.name}</Text>
        
        {priest.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        
        <Text style={styles.specialization}>{specialization}</Text>
        
        <StatsRow 
          ratings={priest.ratings} 
          experience={priest.experience} 
          ceremonyCount={priest.ceremonyCount} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    height: 340,
    position: 'relative',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: THEME.colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
    alignSelf: 'center',
  },
  verifiedText: {
    color: '#22C55E',
    fontSize: THEME.typography.caption,
    marginLeft: 4,
  },
  specialization: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: THEME.typography.body,
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: THEME.typography.caption,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
