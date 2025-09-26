import React, { memo, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useColorScheme,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Colors from "../constants/Colors";
import { SIZES } from "../constants/theme";
import { rMS, rS, rV } from "../constants/responsive";
import GameButton from "./GameButton";

const { width: screenWidth } = Dimensions.get("window");

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  type?: "default" | "warning" | "error" | "success";
  showCloseButton?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = memo(
  ({
    visible,
    title,
    message,
    buttons = [],
    onDismiss,
    type = "default",
    showCloseButton = true,
  }) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? "light"];

    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
      if (visible) {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(1, { duration: 200 });
      } else {
        scale.value = withTiming(0, { duration: 150 });
        opacity.value = withTiming(0, { duration: 150 });
      }
    }, [visible, scale, opacity]);

    const animatedModalStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const getTypeColors = useCallback(() => {
      switch (type) {
        case "warning":
          return {
            borderColor: "#FFA726",
            backgroundColor: themeColors.background,
          };
        case "error":
          return {
            borderColor: themeColors.errorText,
            backgroundColor: themeColors.background,
          };
        case "success":
          return {
            borderColor: "#4CAF50",
            backgroundColor: themeColors.background,
          };
        default:
          return {
            borderColor: themeColors.tint,
            backgroundColor: themeColors.background,
          };
      }
    }, [type, themeColors]);

    const typeColors = getTypeColors();

    const styles = useMemo(
      () =>
        StyleSheet.create({
          modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: rMS(20),
          },
          modalContent: {
            backgroundColor: themeColors.background,
            borderRadius: rMS(8),
            padding: rV(20),
            width: screenWidth * 0.85,
            maxWidth: rS(350),
          },
          header: {
            marginBottom: rV(12),
          },
          title: {
            fontSize: SIZES.large,
            fontWeight: "600",
            color: themeColors.text,
            textAlign: "left",
          },
          message: {
            fontSize: SIZES.small,
            color: themeColors.textSecondary,
            lineHeight: rV(18),
            marginBottom: rV(20),
            textAlign: "left",
          },
          buttonContainer: {
            flexDirection: buttons.length <= 2 ? "row" : "column",
            alignItems: buttons.length <= 2 ? "flex-end" : "flex-end",
            justifyContent: buttons.length <= 2 ? "flex-end" : "flex-start",
            gap: buttons.length <= 2 ? rS(24) : rS(8),
          },
          button: {
            paddingHorizontal: rS(12),
            paddingVertical: rV(8),
            alignItems: "center",
            justifyContent: "center",
            minWidth: buttons.length <= 2 ? rS(80) : rS(100),
            borderRadius: rMS(4),
          },
          buttonText: {
            fontSize: SIZES.small,
            fontWeight: "500",
          },
          defaultButtonText: {
            color: themeColors.text,
          },
          cancelButtonText: {
            color: themeColors.textSecondary,
          },
          destructiveButtonText: {
            color: themeColors.errorText,
          },
        }),
      [themeColors, typeColors]
    );

    const handleButtonPress = useCallback(
      (button: AlertButton) => {
        button.onPress?.();
        onDismiss?.();
      },
      [onDismiss]
    );

    const handleOverlayPress = useCallback(() => {
      onDismiss?.();
    }, [onDismiss]);

    if (!visible) return null;

    return (
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={onDismiss}
        statusBarTranslucent
      >
        <Animated.View style={[styles.modalOverlay, animatedModalStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleOverlayPress}
          />
          <Animated.View style={[styles.modalContent, animatedContentStyle]}>
            {title && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
              </View>
            )}

            {message && <Text style={styles.message}>{message}</Text>}

            {buttons.length > 0 && (
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => {
                  const textStyle = [
                    styles.buttonText,
                    button.style === "destructive"
                      ? styles.destructiveButtonText
                      : button.style === "cancel"
                      ? styles.cancelButtonText
                      : styles.defaultButtonText,
                  ];

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.button}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.6}
                    >
                      <Text style={textStyle}>{button.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }
);

export default CustomAlert;
