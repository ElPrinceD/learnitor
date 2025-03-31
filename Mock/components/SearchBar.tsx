import React, { useState, useCallback, useEffect } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { SIZES, rS, rV } from "../constants";
import debounce from "lodash.debounce";

interface Props {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<Props> = ({ onSearch }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useCallback(
    debounce((query: string) => onSearch(query), 300),
    [onSearch]
  );

  // useEffect(() => {
  //   return () => {
  //     debouncedSearch.cancel();
  //   };
  // }, [debouncedSearch]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const themeStyles = {
    searchBarContainer: {
      backgroundColor: themeColors.background,
      borderColor: themeColors.border,
    },
    searchInput: {
      color: themeColors.text,
    },
    placeholderTextColor: themeColors.placeholder,
    iconColor: themeColors.icon,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchBarContainer, themeStyles.searchBarContainer]}>
        <TextInput
          style={[styles.searchInput, themeStyles.searchInput]}
          placeholder="What do you want to learn today?"
          placeholderTextColor={themeStyles.placeholderTextColor}
          onChangeText={handleSearch}
          value={searchQuery}
        />
        <TouchableOpacity
          style={styles.searchIcon}
          onPress={() => onSearch(searchQuery)} // Immediate search on icon press
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
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: rS(12),
    width: "85%",
    marginTop: rV(12),
    marginBottom: rV(5),
    height: rV(40), // Explicit height
  },
  container: {
    height: rV(60),
    alignItems: "center",
  },
  searchIcon: {
    marginLeft: rS(8),
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.medium,
  },
});

export default SearchBar;
