import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { APP_COLORS } from "../../constants/Colors";

interface InstantBookingCardProps {
  title?: string;
  description?: string;
  onPress: () => void;
  className?: string;
  testID?: string;
}

const InstantBookingCard: React.FC<InstantBookingCardProps> = ({ 
  title = "Need this Puja urgently?", 
  description = "Book a verified priest within 5 mins for immediate requirements.",
  onPress, 
  className = "", 
  testID 
}) => {
  return (
    <View 
      className={`bg-[#FFF3E0] rounded-2xl p-4 flex-row items-center mb-2.5 border border-[#FFE0B2] ${className}`}
      testID={testID}
    >
      <View className="flex-1 mr-3">
        <View className="bg-[#FF9800] flex-row items-center px-2 py-1 rounded self-start mb-1.5">
          <Ionicons name="flash" size={12} color="white" />
          <Text className="text-white text-[10px] font-bold ml-1">INSTANT</Text>
        </View>
        <Text className="text-base font-bold text-[#1A1A1A] mb-1">{title}</Text>
        <Text className="text-xs text-[#666666] leading-5">{description}</Text>
      </View>
      <TouchableOpacity 
        className="bg-[#FF9800] px-4 py-2.5 rounded-xl" 
        onPress={onPress}
      >
        <Text className="text-white text-sm font-bold">Book Now</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InstantBookingCard;
