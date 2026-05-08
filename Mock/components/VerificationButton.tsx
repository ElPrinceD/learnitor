import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
  Animated,
} from "react-native";
import { SIZES, rMS, rS, rV } from "../constants";
import Colors from "../constants/Colors";

type VerificationButtonProps = {
  onPress?: () => void;
  title?: string | React.ReactElement;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  children?: React.ReactNode;
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  const styles = StyleSheet.create({
    button: {
      paddingVertical: rV(14),
      paddingHorizontal: rMS(24),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.tint,
      width: rS(260),
      borderRadius: rMS(28),
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    text: {
      fontSize: rMS(15),
      fontWeight: "700",
      color: "#fff",
      textAlign: "center",
      letterSpacing: 0.3,
    },
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
          ...(Array.isArray(style) ? style : [style]),
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.8}
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
    </Animated.View>
  );
};

export default VerificationButton;
