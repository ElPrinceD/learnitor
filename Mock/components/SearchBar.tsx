import React, { useState, useCallback, memo } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Search, X } from "lucide-react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import debounce from "lodash.debounce";

interface Props {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<Props> = ({ onSearch }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useCallback(
    debounce((query: string) => onSearch(query), 300),
    [onSearch]
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <View style={styles(themeColors, shadow).container}>
      <View style={styles(themeColors, shadow).searchBarContainer}>
        <Search
          size={18}
          color={themeColors.textSecondary}
          style={{ marginRight: rS(8) }}
        />
        <TextInput
          style={styles(themeColors, shadow).searchInput}
          placeholder="What do you want to learn today?"
          placeholderTextColor={themeColors.placeholder}
          onChangeText={handleSearch}
          value={searchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles(themeColors, shadow).clearButton}
            onPress={clearSearch}
          >
            <X size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = (themeColors: any, shadow: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: rS(16),
      paddingTop: rV(8),
      paddingBottom: rV(6),
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      borderRadius: rMS(24),
      paddingHorizontal: rMS(16),
      paddingVertical: rV(10),
      ...shadow.small,
    },
    searchInput: {
      flex: 1,
      fontSize: rMS(13),
      fontWeight: "600",
      color: themeColors.text,
      padding: 0,
    },
    clearButton: {
      marginLeft: rS(8),
      padding: rMS(2),
    },
  });

export default memo(SearchBar);
