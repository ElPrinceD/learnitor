import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from "react-native";
import { SIZES, rMS, rS } from "../constants";
import Colors from "../constants/Colors";

type VerificationButtonProps = {
  onPress?: () => void;
  title?: string | React.ReactElement; // Updated to accept a string or React element
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[]; // Updated to accept a list of styles
  textStyle?: TextStyle | TextStyle[]; // Updated to accept a list of styles
  children?: React.ReactNode; // Added children prop
};

const VerificationButton: React.FC<VerificationButtonProps> = ({
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
      padding: rMS(10),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.buttonBackground,
      width: rS(250),
      borderRadius: 10,
    },
    buttonDisabled: {
      backgroundColor: "gray",
    },
    text: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
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

export default VerificationButton;
