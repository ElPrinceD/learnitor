import React from "react";
import { View, FlatList, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Streak {
  name: string;
  streak: boolean;
}

interface Props {
  streakData: Streak[];
}

const StreakList: React.FC<Props> = ({ streakData }) => {
  const colorScheme = useColorScheme();

  const renderItem = ({ item }: { item: Streak }) => (
    <View style={{ marginHorizontal: 10, alignItems: "center" }}>
      <Ionicons
        name={item.streak ? "flash" : "flash-outline"}
        size={55} // Adjust the size as needed for medium size
        color={item.streak ? "gold" : "grey"}
      />
      <Text style={{ color: colorScheme === "dark" ? "white" : "black" }}>
        {item.name}
      </Text>
    </View>
  );

  return (
    <FlatList
      horizontal
      data={streakData}
      renderItem={renderItem}
      keyExtractor={(_item, index) => index.toString()}
      showsHorizontalScrollIndicator={false} // Hide horizontal scroll indicator
      contentContainerStyle={{ paddingHorizontal: 3 }} // Add padding to the sides
      initialNumToRender={5} // Render 5 items initially
      maxToRenderPerBatch={5} // Render additional items in batches of 5
      windowSize={10} // Increase window size for better performance
    />
  );
};

export default StreakList;
