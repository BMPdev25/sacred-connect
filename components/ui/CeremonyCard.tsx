import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getImageUri } from "../../utils/imageUtils";

interface CeremonyCardProps {
  ceremony: {
    _id?: string;
    id?: string;
    name: string;
    image?: string;
    images?: string[];
  };
  onPress: () => void;
  className?: string;
  testID?: string;
}

const CeremonyCard: React.FC<CeremonyCardProps> = ({ 
  ceremony, 
  onPress, 
  className = "", 
  testID 
}) => {
  return (
    <TouchableOpacity
      className={`w-40 h-48 rounded-2xl mr-3 overflow-hidden relative ${className}`}
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
    >
      <Image
        source={{ uri: getImageUri(ceremony.image || ceremony.images?.[0]) }}
        className="w-full h-full"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-black/30" />
      <Text 
        className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white shadow-sm" 
        numberOfLines={2}
      >
        {ceremony.name}
      </Text>
    </TouchableOpacity>
  );
};

export default CeremonyCard;
