import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";


interface Props {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<Props> = ({ onSearch }) => {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text === "") {
      onSearch(""); // Reset filtered courses to original list when search query is empty
    } else {
      onSearch(text);
    }
  };

  // Determine color scheme
  const isDarkMode = colorScheme === "dark";

  return (
    <LinearGradient
        colors={['#fdecd2', '#FFFFFF']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 5 }}
        style={styles.backgroundGradient}
      >
    <View
      style={[
        styles.searchBarContainer,
        { backgroundColor: isDarkMode ? "#333" : "#fff" }, // Background color based on the color scheme
      ]}
    >
      <TextInput
        style={[
          styles.searchInput,
          { color: isDarkMode ? "#fff" : "#333" }, // Text color based on the color scheme
        ]}
        placeholder="Search for courses..."
        placeholderTextColor={isDarkMode ? "#aaa" : "#666"} // Placeholder text color based on the color scheme
        onChangeText={handleSearch}
        value={searchQuery}
      />
      <TouchableOpacity
        style={styles.searchIcon}
        onPress={() => handleSearch(searchQuery)}
      >
        <Ionicons
          name="search"
          size={24}
          color={isDarkMode ? "#fff" : "#666"} // Icon color based on the color scheme
        />
      </TouchableOpacity>
    </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "transparent",
    justifyContent: "center",
    // height: "10.33%", 
  },
  backgroundGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
});

export default SearchBar;
