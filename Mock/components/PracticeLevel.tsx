import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  useColorScheme,
} from "react-native";
import { Level } from "./types";
import Colors from "../constants/Colors";
import { rMS, rS, rV, useShadows } from "../constants";

interface Props {
  onPress: (level: Level) => void;
  levels: Level[];
}

const PracticeLevel: React.FC<Props> = ({ onPress, levels }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const styles = StyleSheet.create({
    item: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      marginVertical: rV(8),
      flex: 1,
      marginHorizontal: rS(6),
      height: rV(180),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      overflow: "hidden",
      ...shadow.small,
    },
    imageContainer: {
      flex: 4,
      width: "100%",
      height: "70%",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    textContainer: {
      flex: 1,
      width: "100%",
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: rV(4),
    },
    title: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.1,
    },
    listContainer: {
      paddingHorizontal: rS(10),
      paddingBottom: rV(8),
    },
  });

  const renderRowItem = ({ item }: { item: Level }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={levels}
      numColumns={2}
      renderItem={renderRowItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.listContainer}
    />
  );
};

export default PracticeLevel;
