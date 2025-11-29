import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

interface Pujari {
  id: string;
  name: string;
  rating: number;
  languages: string[];
  image: string;
  basePrice: number;
  distance: string;
}

interface Props {
  pujari: Pujari;
  onPress: () => void;
}

export default function PujariCard({ pujari, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      
      <Image source={{ uri: pujari.image }} style={styles.avatar} />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{pujari.name}</Text>
        <Text style={styles.meta}>⭐ {pujari.rating} • {pujari.distance}</Text>
        <Text style={styles.price}>₹ {pujari.basePrice} onwards</Text>
        <Text style={styles.langs}>Languages: {pujari.languages.join(", ")}</Text>
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    gap: 12,
  },
  avatar: { width: 70, height: 70, borderRadius: 10 },
  name: { fontSize: 18, fontWeight: "600" },
  meta: { color: "#777", marginTop: 2 },
  price: { marginTop: 4, fontWeight: "700" },
  langs: { fontSize: 13, color: "#666", marginTop: 3 },
});
