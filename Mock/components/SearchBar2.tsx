import React, { useState, useCallback, useMemo } from "react";
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
import debounce from "lodash.debounce";

interface Props {
  onSearch: (query: string) => void;
}

const SearchBar2: React.FC<Props> = ({ onSearch }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((text: string) => onSearch(text), 300),
    []
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      debouncedSearch(text);
    },
    [debouncedSearch]
  );

  const themeStyles = useMemo(
    () => ({
      searchBarContainer: {
        backgroundColor: themeColors.background,
        borderColor: themeColors.border,
      },
      searchInput: {
        color: themeColors.text,
      },
      placeholderTextColor: themeColors.placeholder,
      iconColor: themeColors.icon,
    }),
    [themeColors]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchBarContainer, themeStyles.searchBarContainer]}>
        <TextInput
          style={[styles.searchInput, themeStyles.searchInput]}
          placeholder="What are you looking for?"
          placeholderTextColor={themeStyles.placeholderTextColor}
          onChangeText={handleSearch}
          value={searchQuery}
        />
        <TouchableOpacity
          style={styles.searchIcon}
          onPress={() => handleSearch(searchQuery)}
        >
          <Ionicons name="search" size={24} color={themeStyles.iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: rS(12),
    justifyContent: "center",
    width: "85%",
    height: "140%",
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

export default SearchBar2;
