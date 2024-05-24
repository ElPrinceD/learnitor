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

interface Props {
  onPress: (level: Level) => void;
  levels: Level[]; // Add levels prop
}

const PracticeLevel: React.FC<Props> = ({ onPress, levels }) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 50,
      paddingHorizontal: 10,
    },
    item: {
      backgroundColor: colorScheme === "dark" ? "#181818" : "#fff",
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 15,
      flex: 1,
      marginHorizontal: 5,
      height: 200,
      elevation: 3,
      shadowColor: colorScheme === "dark" ? "#000" : "#ccc",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
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
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 10,
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#333",
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
    <View style={styles.container}>
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
