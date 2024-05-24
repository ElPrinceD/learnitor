import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type GameButtonProps = {
  onPress: () => void;
  title: string;
  disabled?: boolean; // Make disabled optional
};

const GameButton: React.FC<GameButtonProps> = ({
  onPress,
  title,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007BFF",
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
