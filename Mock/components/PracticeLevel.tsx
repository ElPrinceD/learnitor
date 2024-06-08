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
import { SIZES, rMS, rS, rV, useShadows } from "../constants";

interface Props {
  onPress: (level: Level) => void;
  levels: Level[]; // Add levels prop
}

const PracticeLevel: React.FC<Props> = ({ onPress, levels }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadows = useShadows();

  const styles = StyleSheet.create({
    item: {
      backgroundColor: themeColors.card,
      borderRadius: 10,
      marginVertical: rV(13),
      flex: 1,
      marginHorizontal: 5,
      height: rV(180),
      ...shadows.small,
    },
    imageContainer: {
      flex: 4,
      width: "100%",
      height: "70%",
      borderRadius: 10,
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
    },
    title: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      marginTop: 10,
      marginBottom: rV(8),
      color: themeColors.text,
    },
  });

  const renderRowItem = ({ item }: { item: Level }) => (
    <TouchableOpacity style={styles.item} onPress={() => onPress(item)}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={levels}
        numColumns={2}
        renderItem={renderRowItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default PracticeLevel;
