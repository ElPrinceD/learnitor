import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  Animated,
  Easing,
  StyleSheet,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { SIZES, rMS, rS } from "../constants";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type AnimatedTextInputProps = {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  showToggleIcon?: boolean;
};

const AnimatedTextInput: React.FC<AnimatedTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  secureTextEntry,
  showToggleIcon,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const transY = useRef(new Animated.Value(0));
  const borderWidth = useRef(new Animated.Value(1));

  const handleFocus = () => {
    animateTransform(-30);
    animateBorderWidth(2);
  };

  const handleBlur = () => {
    if (value) return;

    animateTransform(0);
    animateBorderWidth(1);
  };

  const animateTransform = (toValue: number) => {
    Animated.timing(transY.current, {
      toValue,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  };

  const animateBorderWidth = (toValue: number) => {
    Animated.timing(borderWidth.current, {
      toValue,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.ease,
    }).start();
  };

  const transX = transY.current.interpolate({
    inputRange: [-30, 0],
    outputRange: [-15, 0],
    extrapolate: "clamp",
  });

  const borderColor = borderWidth.current.interpolate({
    inputRange: [0, 2],
    outputRange: [themeColors.text, themeColors.border],
    extrapolate: "clamp",
  });

  const labelColorAnimation = borderWidth.current.interpolate({
    inputRange: [0, 2],
    outputRange: [themeColors.textSecondary, themeColors.selectedText],
    extrapolate: "clamp",
  });

  const fontSize = borderWidth.current.interpolate({
    inputRange: [0, 2],
    outputRange: [SIZES.medium, SIZES.small],
    extrapolate: "clamp",
  });

  const styles = StyleSheet.create({
    inputWrapper: {
      marginBottom: rMS(16),
      width: rS(320),
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 10,
      padding: rMS(16),
      color: themeColors.text,
    },
    labelContainer: {
      position: "absolute",
      padding: rMS(18),
    },
    label: {
      borderRadius: 70,
      backgroundColor: themeColors.background,
      zIndex: 1,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 10,
      padding: rMS(16),
      marginBottom: rMS(16),
      color: themeColors.text,
    },
    toggleIcon: {
      position: "absolute",
      right: rMS(1),
      top: rMS(0),
    },
  });

  return (
    <Animated.View
      style={[
        styles.inputWrapper,
        { borderWidth: borderWidth.current, borderColor },
      ]}
    >
      <Animated.View
        style={[
          styles.labelContainer,
          {
            transform: [{ translateY: transY.current }, { translateX: transX }],
          },
        ]}
      >
        <Animated.Text
          style={[styles.label, { color: labelColorAnimation, fontSize }]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
      {showToggleIcon ? (
        <View>
          <TextInput
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggleIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color={themeColors.icon}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TextInput
          // style={[styles.input]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
        />
      )}
    </Animated.View>
  );
};

export default AnimatedTextInput;
