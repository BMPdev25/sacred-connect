import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { APP_COLORS } from "../../constants/Colors";

interface SectionHeaderProps {
  title: string;
  className?: string;
  testID?: string;
  showBorder?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  className = "", 
  testID,
  showBorder = false 
}) => {
  return (
    <View 
      className={`mt-5 mb-2 ${className}`} 
      testID={testID}
      style={showBorder ? styles.border : undefined}
    >
      <Text className="text-lg font-semibold text-[#1A1A1A]">
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  border: {
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.saffron,
    paddingLeft: 10,
  }
});

export default SectionHeader;
