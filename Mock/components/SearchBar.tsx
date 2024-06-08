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
import { SIZES, rS, rV } from "../constants";

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
          placeholder="What do you want to learn today?"
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
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: rS(12),
    width: "85%",
    marginTop: rV(12),
    justifyContent: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  searchIcon: {
    marginLeft: rS(8),
    height: "100%",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.medium,
  },
});

export default SearchBar;
