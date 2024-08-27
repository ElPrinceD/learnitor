import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import Colors from "../constants/Colors";
import { rMS, rV } from "../constants/responsive";
import { SIZES } from "../constants/theme";

const CommunityItem = ({ community, handleEditCommunity }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <TouchableOpacity style={styles.container} onPress={handleEditCommunity}>
      <View style={styles.textContainer}>
        <Text style={[styles.communityName, { color: themeColors.text }]}>
          {community.name}
        </Text>
        <Text style={[styles.communityDescription, { color: themeColors.textSecondary }]}>
          {community.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: rMS(16),
    marginBottom: rV(12),
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: rMS(10),
  },
  communityName: {
    fontSize: SIZES.large,
    fontWeight: "bold",
  },
  communityDescription: {
    fontSize: SIZES.medium,
    marginTop: rV(4),
  },
});

export default CommunityItem;
