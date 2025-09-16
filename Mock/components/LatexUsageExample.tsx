import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import LatexRenderer from "./LatexRenderer";
import Colors from "../constants/Colors";
import { SIZES, rMS, rV } from "../constants";

/**
 * Example component showing how to use LaTeX rendering for chemical formulas
 * This can be integrated into your existing question components
 */
const LatexUsageExample: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      padding: rMS(20),
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(10),
    },
    example: {
      marginBottom: rV(15),
      padding: rMS(10),
      backgroundColor: themeColors.card,
      borderRadius: rMS(8),
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chemical Formula Examples</Text>

      {/* Example 1: Simple chemical formula */}
      <View style={styles.example}>
        <Text>Question: What is the chemical formula for water?</Text>
        <LatexRenderer latex="H2O" />
      </View>

      {/* Example 2: Chemical equation */}
      <View style={styles.example}>
        <Text>Question: Balance this equation:</Text>
        <LatexRenderer latex="H2 + O2 → H2O" />
      </View>

      {/* Example 3: Ion with charge */}
      <View style={styles.example}>
        <Text>Question: What is the sulfate ion?</Text>
        <LatexRenderer latex="SO4^2-" />
      </View>

      {/* Example 4: Complex organic molecule */}
      <View style={styles.example}>
        <Text>Question: What is the molecular formula for glucose?</Text>
        <LatexRenderer latex="C6H12O6" />
      </View>

      {/* Example 5: LaTeX with proper formatting */}
      <View style={styles.example}>
        <Text>Question: What is the LaTeX representation?</Text>
        <LatexRenderer latex="H_2SO_4 + 2NaOH \\rightarrow Na_2SO_4 + 2H_2O" />
      </View>
    </View>
  );
};

export default LatexUsageExample;
