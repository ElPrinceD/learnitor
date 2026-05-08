import React, { useState, useCallback, useMemo } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Search } from "lucide-react-native";
import Colors from "../constants/Colors";
import { SIZES, rS, rV } from "../constants";
import debounce from "lodash.debounce";

interface Props {
  onSearch: (query: string) => void;
}

const arePropsEqual = (prevProps: Props, nextProps: Props) => {
  // Only compare the functional reference of onSearch
  return prevProps.onSearch === nextProps.onSearch;
};

const SearchBar2: React.FC<Props> = ({ onSearch }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((text: string) => onSearch(text), 300),
    [onSearch] // Ensure onSearch is a dependency
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
          <Search size={22} color={themeStyles.iconColor} />
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
    width: "90%",
    marginBottom: rV(18),
    justifyContent: "center",
    height: rV(40),
  },
  container: {
    height: rV(60),
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

// Wrap SearchBar2 with React.memo and provide the custom comparison function
export default React.memo(SearchBar2, arePropsEqual);
