import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors"; // Adjust the import path as necessary

interface Props {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<Props> = ({ onSearch }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: themeColors.background,
            borderColor: themeColors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search for courses..."
          placeholderTextColor={themeColors.placeholder}
          onChangeText={handleSearch}
          value={searchQuery}
        />
        <TouchableOpacity
          style={styles.searchIcon}
          onPress={() => handleSearch(searchQuery)}
        >
          <Ionicons name="search" size={24} color={themeColors.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    width: "85%",
    paddingVertical: 10,
    marginTop: 15,
    justifyContent: "center",
  },
  container: {
    flex: 0.8,
    alignItems: "center",
  },
  searchIcon: {
    marginLeft: 10,
    height: "100%",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
});

export default SearchBar;
