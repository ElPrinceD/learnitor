import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

type GameButtonProps = {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[]; // Updated to accept a list of styles
  textStyle?: TextStyle | TextStyle[]; // Updated to accept a list of styles
};

const GameButton: React.FC<GameButtonProps> = ({
  onPress,
  title,
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, ...(Array.isArray(style) ? style : [style])]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, ...(Array.isArray(textStyle) ? textStyle : [textStyle])]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#9a580d",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default GameButton;
