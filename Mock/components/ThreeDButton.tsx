import React, { memo, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
} from "react-native";
import { Play } from "lucide-react-native";
import Colors from "../constants/Colors";
import { rMS, rS, rV, SIZES } from "../constants";

interface ThreeDButtonProps {
  isQuestion: boolean;
  onPress: () => void;
}

const ThreeDButton: React.FC<ThreeDButtonProps> = ({ isQuestion, onPress }) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const onPressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const innerStyle = {
    borderRadius: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 16],
    }),
  };
  const heightStyle = {
    marginTop: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-15, 0],
    }),
    paddingBottom: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 0],
    }),
  };

  // Theme-aware colors based on tint
  const outerColor = themeColors.tint;
  const heightColor = colorScheme === "dark" ? themeColors.tint + "80" : themeColors.tint + "CC";
  const innerColor = colorScheme === "dark" ? themeColors.tint + "E0" : themeColors.tint;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: rV(18),
      alignItems: "center",
      justifyContent: "center",
    },
    button: {
      height: rV(50),
      width: rS(60),
    },
    outer: {
      flex: 1,
      padding: rMS(8),
      borderRadius: 10,
      transform: [{ rotate: "45deg" }],
      backgroundColor: outerColor,
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 9 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    height: {
      borderRadius: 15,
      backgroundColor: heightColor,
    },
    inner: {
      backgroundColor: innerColor,
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        <View style={styles.button}>
          <View style={styles.outer}>
            <Animated.View style={[styles.height, heightStyle]}>
              <Animated.View style={[styles.inner, innerStyle]}>
                {isQuestion ? (
                  <View style={{ transform: [{ rotate: "-45deg" }] }}>
                    <Play size={20} color="#fff" fill="#fff" />
                  </View>
                ) : (
                  <Text style={styles.buttonText}></Text>
                )}
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default memo(ThreeDButton);
