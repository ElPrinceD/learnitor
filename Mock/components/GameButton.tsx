import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

type GameButtonProps = {
  onPress: () => void;
  title: string;
  disabled?: boolean; // Make disabled optional
  style?: ViewStyle | ViewStyle[]; // Add style prop
  disabledStyle?: ViewStyle;
  textStyle?: TextStyle | TextStyle[];
};

const GameButton: React.FC<GameButtonProps> = ({
  onPress,
  title,
  disabled = false,
  style,
  textStyle,
  disabledStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && [styles.buttonDisabled, disabledStyle],
        ...(Array.isArray(style) ? style : [style]),
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          ...(Array.isArray(textStyle) ? textStyle : [textStyle]),
        ]}
      >
        {title}
      </Text>
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
    backgroundColor: "red",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default GameButton;
