import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import MathJax from "react-native-katex";
import Colors from "../constants/Colors";
import { SIZES } from "../constants";
import { containsLatex, processTextForLatex } from "../utils/latexUtils";

interface LatexRendererProps {
  latex: string;
  fontSize?: number;
  color?: string;
  style?: any;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({
  latex,
  fontSize = SIZES.medium,
  color,
  style,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const textColor = color || themeColors.text;

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
    },
    mathContainer: {
      backgroundColor: "transparent",
    },
  });

  // Process the input text using utility functions
  const processedLatex = processTextForLatex(latex);

  try {
    return (
      <View style={[styles.container, style]}>
        <MathJax expression={processedLatex} style={styles.mathContainer} />
      </View>
    );
  } catch (error) {
    console.error("LaTeX rendering error:", error);
    // Fallback to plain text if LaTeX rendering fails
    return <Text style={[style, { color: textColor, fontSize }]}>{latex}</Text>;
  }
};

export default LatexRenderer;
