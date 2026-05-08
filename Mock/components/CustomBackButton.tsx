import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";
import { rMS } from "../constants";

export default function CustomBackButton({ label = "Back", icon = true }) {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <View style={{ paddingLeft: 10 }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        {icon && (
          <ChevronLeft
            size={24}
            color={themeColors.text}
            style={{ marginRight: 1 }}
          />
        )}
        <Text style={{ color: themeColors.text, fontSize: rMS(17) }}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
