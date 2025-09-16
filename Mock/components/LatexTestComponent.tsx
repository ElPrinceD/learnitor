import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import LatexRenderer from "./LatexRenderer";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";

const LatexTestComponent: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(20),
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(20),
      textAlign: "center",
    },
    section: {
      marginBottom: rV(30),
    },
    sectionTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.tint,
      marginBottom: rV(10),
    },
    example: {
      marginBottom: rV(15),
      padding: rMS(10),
      backgroundColor: themeColors.card,
      borderRadius: rMS(8),
    },
    exampleLabel: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginBottom: rV(5),
    },
  });

  const chemicalExamples = [
    "H2O",
    "CO2",
    "CH4",
    "H2SO4",
    "NaOH",
    "Ca(OH)2",
    "SO4^2-",
    "NH4^+",
    "C6H12O6",
    "CH3COOH",
  ];

  const equationExamples = [
    "H2 + O2 → H2O",
    "2H2 + O2 → 2H2O",
    "CaCO3 + 2HCl → CaCl2 + H2O + CO2",
    "NaOH + HCl → NaCl + H2O",
    "CH4 + 2O2 → CO2 + 2H2O",
  ];

  const latexExamples = [
    "H_2O",
    "CO_2",
    "H_2SO_4",
    "SO_4^{2-}",
    "NH_4^+",
    "C_6H_{12}O_6",
    "\\frac{1}{2}mv^2",
    "E = mc^2",
    "\\sum_{i=1}^{n} x_i",
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>LaTeX Chemical Formula Renderer</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Chemical Formulas (Auto-detected)
        </Text>
        {chemicalExamples.map((formula, index) => (
          <View key={index} style={styles.example}>
            <Text style={styles.exampleLabel}>Input: {formula}</Text>
            <LatexRenderer latex={formula} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chemical Equations</Text>
        {equationExamples.map((equation, index) => (
          <View key={index} style={styles.example}>
            <Text style={styles.exampleLabel}>Input: {equation}</Text>
            <LatexRenderer latex={equation} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LaTeX Examples</Text>
        {latexExamples.map((latex, index) => (
          <View key={index} style={styles.example}>
            <Text style={styles.exampleLabel}>Input: {latex}</Text>
            <LatexRenderer latex={latex} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default LatexTestComponent;
