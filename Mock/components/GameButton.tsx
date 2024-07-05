import React, { memo } from "react";
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
  style?: ViewStyle | ViewStyle[]; // Updated to accept a list of styles
  textStyle?: TextStyle | TextStyle[]; // Updated to accept a list of styles
  children?: React.ReactNode; // Added children prop
};

const GameButton: React.FC<GameButtonProps> = ({
  onPress,
  title,
  disabled = false,
  style,
  textStyle,
  children,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    button: {
      backgroundColor: themeColors.buttonBackground,
      padding: 10,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: {
      backgroundColor: "red",
    },
    text: {
      color: themeColors.text,
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
  });
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        ...(Array.isArray(style) ? style : [style]),
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      {children ? (
        children
      ) : (
        <Text
          style={[
            styles.text,
            ...(Array.isArray(textStyle) ? textStyle : [textStyle]),
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default memo(GameButton);
