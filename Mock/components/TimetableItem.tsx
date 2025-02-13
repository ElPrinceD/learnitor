import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import Colors from "../constants/Colors";

const TimetableItem = ({ plan, onPress }) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? "light"];

  return (
    <TouchableOpacity style={styles.planItemWrapper} onPress={() => onPress(plan)}>
      <View>
        <Text style={[styles.planItemText, { color: themeColors.text }]}>
          {plan.name}
        </Text>
        <Text style={[styles.planItemText, { color: themeColors.textSecondary }]}>
          {plan.description}
        </Text>
        <Text style={[styles.planItemText, { color: themeColors.textSecondary }]}>
          Created by: {plan.created_by}
        </Text>
        <Text style={[styles.planItemText, { color: themeColors.textSecondary }]}>
          Created at: {new Date(plan.created_at).toLocaleString()}
        </Text>
        <Text style={[styles.planItemText, { color: themeColors.textSecondary }]}>
          Updated at: {new Date(plan.updated_at).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  planItemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  planItemText: {
    fontSize: 14,
  },
});

export default TimetableItem;