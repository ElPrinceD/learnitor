import React, { memo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import type { Institution } from "../../services/SignupApiCalls";

interface Props {
  selected: Institution | null;
  onPress: () => void;
  hasError?: boolean;
  errorMessage?: string;
  hint?: string;
}

const InstitutionSelectField: React.FC<Props> = ({
  selected,
  onPress,
  hasError = false,
  errorMessage = "Please select your school",
  hint,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const borderColor = hasError ? "#D22B2B" : themeColors.border;

  const styles = StyleSheet.create({
    wrapper: {
      width: rS(280),
      alignSelf: "center",
    },
    label: {
      fontSize: rMS(12),
      fontWeight: "700",
      color: hasError ? "#D22B2B" : themeColors.textSecondary,
      marginBottom: rV(6),
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor,
      borderRadius: rMS(12),
      paddingHorizontal: rS(16),
      paddingVertical: rV(14),
      backgroundColor: themeColors.background,
    },
    value: {
      flex: 1,
      fontSize: rMS(14),
      fontWeight: "600",
      color: selected ? themeColors.text : themeColors.textSecondary,
      marginRight: rS(8),
    },
    error: {
      fontSize: rMS(12),
      color: "#D22B2B",
      fontWeight: "600",
      marginTop: rV(6),
    },
    hint: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      fontWeight: "500",
      marginTop: rV(6),
    },
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>School</Text>
      <TouchableOpacity
        style={styles.field}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.value} numberOfLines={2}>
          {selected ? selected.name : "Select your school"}
        </Text>
        <ChevronDown size={20} color={themeColors.textSecondary} />
      </TouchableOpacity>
      {hint && !selected ? <Text style={styles.hint}>{hint}</Text> : null}
      {hasError && !selected ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : null}
    </View>
  );
};

export default memo(InstitutionSelectField);
