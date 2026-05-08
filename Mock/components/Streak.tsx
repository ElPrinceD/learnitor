import React from "react";
import { View, FlatList, Text, useColorScheme } from "react-native";
import { Zap } from "lucide-react-native";
import { Streak } from "./types";

interface Props {
  streakData: Streak[];
}

const StreakList: React.FC<Props> = ({ streakData }) => {
  const colorScheme = useColorScheme();

  const renderItem = ({ item }: { item: Streak }) => (
    <View style={{ marginHorizontal: 10, alignItems: "center" }}>
      <Zap
        size={55}
        color={item.streak ? "gold" : "grey"}
        fill={item.streak ? "gold" : "none"}
        strokeWidth={item.streak ? 2 : 1.5}
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
