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
  KeyboardTypeOptions,
} from "react-native";
import { SIZES, rMS } from "../constants";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type AnimatedTextInputProps = {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocusChange?: (isFocused: boolean) => void;
  onFocus?: () => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  style?: ViewStyle | TextStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  showToggleIcon?: boolean;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

const AnimatedTextInput: React.FC<AnimatedTextInputProps> = ({
  label,
  value,
  onChangeText,
  onFocusChange,
  onFocus,
  placeholder,
  placeholderTextColor,
  secureTextEntry,
  showToggleIcon,
  style,
  editable = true,
  keyboardType,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const transY = useRef(new Animated.Value(0));
  const borderWidth = useRef(new Animated.Value(1));

  const handleFocus = () => {
    animateTransform(-30);
    animateBorderWidth(2);
    onFocusChange?.(true);
    onFocus?.();
  };

  const handleBlur = () => {
    if (value) return;

    animateTransform(0);
    animateBorderWidth(1);
    onFocusChange?.(false);
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

  useEffect(() => {
    if (value) {
      handleFocus();
    }
  }, [value]);

  const transX = transY.current.interpolate({
    inputRange: [rMS(-30), rMS(0)],
    outputRange: [rMS(-15), rMS(0)],
    extrapolate: "clamp",
  });

  const borderColor = borderWidth.current.interpolate({
    inputRange: [rMS(0), rMS(2)],
    outputRange: [themeColors.text, themeColors.border],
    extrapolate: "clamp",
  });

  const labelColorAnimation = borderWidth.current.interpolate({
    inputRange: [rMS(0), rMS(2)],
    outputRange: [themeColors.textSecondary, themeColors.selectedText],
    extrapolate: "clamp",
  });

  const fontSize = borderWidth.current.interpolate({
    inputRange: [rMS(0), rMS(2)],
    outputRange: [SIZES.medium, SIZES.small],
    extrapolate: "clamp",
  });

  const styles = StyleSheet.create({
    inputWrapper: {
      marginBottom: rMS(16),
      width: "100%",
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 10,
      padding: rMS(16),
      color: themeColors.text,
    },
    labelContainer: {
      position: "absolute",
      padding: rMS(20),
    },
    label: {
      borderRadius: 70,
      backgroundColor: themeColors.background,
      zIndex: 1,
    },
    input: {
      color: themeColors.text,
    },
    toggleIcon: {
      position: "absolute",
      right: rMS(1),
      top: rMS(0),
    },
  });

  // Handle the Enter key to prevent multiline input
  const handleSubmitEditing = () => {
    // Prevent new line and blur on submit
    if (onFocusChange) {
      onFocusChange(false);
    }
  };

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
            style={[styles.input, ...(Array.isArray(style) ? style : [style])]}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!showPassword}
            editable={editable}
            keyboardType={keyboardType}
            returnKeyType="done" // "Done" instead of "Enter"
            onSubmitEditing={handleSubmitEditing} // Prevent new line and blur
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
          onFocus={handleFocus}
          style={[styles.input, ...(Array.isArray(style) ? style : [style])]}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          editable={editable}
          keyboardType={keyboardType}
          returnKeyType="done" // "Done" instead of "Enter"
          multiline={false} // Disable multiline to prevent new line
          onSubmitEditing={handleSubmitEditing} // Prevent new line and blur
        />
      )}
    </Animated.View>
  );
};

export default AnimatedTextInput;
