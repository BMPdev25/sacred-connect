import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchPujaById, fetchPujarisForPuja } from "../../../services/pujaApi";
import PujariCard from "../../../components/PujariCard";
import { APP_COLORS } from '../../../constants/Colors'
export default function PujaDetail() {
  const { pujaId } = useLocalSearchParams<{ pujaId: string }>();
  const router = useRouter();

  const { data: puja, isLoading } = useQuery({
    queryKey: ["puja", pujaId],
    queryFn: () => fetchPujaById(pujaId),
  });

  const { data: pujaris, isLoading: loadingPujaris } = useQuery({
    queryKey: ["pujaris", pujaId],
    queryFn: () => fetchPujarisForPuja(pujaId),
  });

  // FIX: handle undefined
  if (isLoading || !puja) {
    return <ActivityIndicator size="large" />;
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: APP_COLORS.background }} 
    contentContainerStyle={styles.container}>
  
      {/* Header image */}
      <Image source={{ uri: puja.image }} style={styles.headerImage} />

      {/* Title */}
      <Text style={styles.title}>{puja.name}</Text>

      {/* Description */}
      <Text style={styles.sectionTitle}>About this Puja</Text>
      <Text style={styles.description}>{puja.description}</Text>

      {/* Requirements */}
      <Text style={styles.sectionTitle}>Requirements</Text>
      {puja.requirements?.map((req: string, idx: number) => (
        <Text key={idx} style={styles.bullet}>• {req}</Text>
      ))}

      {/* Duration */}
      <Text style={styles.sectionTitle}>Duration</Text>
      <Text style={styles.description}>{puja.duration}</Text>

      {/* Pujaris Nearby */}
      <Text style={styles.sectionTitle}>Available Pujaris Nearby</Text>

      {loadingPujaris ? (
        <ActivityIndicator size="small" />
      ) : (
        pujaris?.map((p: any) => (
          <PujariCard
            key={p.id}
            pujari={p}
            onPress={() => router.push(`/priest/${p.id}`)} // Redirect to priest profile
          />
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 16,
    backgroundColor: APP_COLORS.background,
    flexGrow: 1
  },
  headerImage: { 
    width: "100%", 
    height: 220, 
    borderRadius: 12 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "bold", 
    marginTop: 12, 
    color: APP_COLORS.black 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    marginTop: 22, 
    color: APP_COLORS.black 
  },
  description: { 
    fontSize: 15, 
    color: APP_COLORS.gray, 
    marginTop: 6, 
    lineHeight: 20 
  },
  bullet: { 
    fontSize: 15, 
    marginTop: 4, 
    color: APP_COLORS.gray, 
    marginLeft: 8 
  }
});

