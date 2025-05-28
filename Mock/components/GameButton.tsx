import React, { memo, useMemo } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from "react-native";
import Colors from "../constants/Colors";

type GameButtonProps = {
  onPress?: () => void;
  title?: string;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  children?: React.ReactNode;
};

// Static styles moved outside component to avoid recreation
const baseStyles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    // backgroundColor is set dynamically
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

const GameButton: React.FC<GameButtonProps> = memo(
  ({ onPress, title, disabled = false, style, textStyle, children }) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? "light"];

    // Memoize merged container styles
    const containerStyles = useMemo(() => {
      const stylesArray: ViewStyle[] = [
        {
          backgroundColor: disabled
            ? themeColors.buttonDisabled
            : themeColors.buttonBackground,
        },
        baseStyles.button,
      ];
      if (style) {
        if (Array.isArray(style)) stylesArray.push(...style);
        else stylesArray.push(style as ViewStyle);
      }
      return stylesArray;
    }, [
      disabled,
      style,
      themeColors.buttonBackground,
      themeColors.buttonDisabled,
    ]);

    // Memoize merged text styles
    const titleStyles = useMemo(() => {
      const stylesArray: TextStyle[] = [
        { color: themeColors.background },
        baseStyles.text,
      ];
      if (textStyle) {
        if (Array.isArray(textStyle)) stylesArray.push(...textStyle);
        else stylesArray.push(textStyle as TextStyle);
      }
      return stylesArray;
    }, [textStyle, themeColors.background]);

    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.6}
      >
        {children ? children : <Text style={titleStyles}>{title}</Text>}
      </TouchableOpacity>
    );
  }
);

export default GameButton;
