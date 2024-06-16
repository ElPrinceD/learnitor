import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
} from "react-native";
import Colors from "../constants/Colors";
import { rMS, rS, rV } from "../constants";

const ThreeDButton = ({ title, onPress }) => {
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
      backgroundColor: themeColors.tintSecond,
      // backgroundColor: "#436A6E",
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 9 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 5,
    },
    height: {
      borderRadius: 15,
      // backgroundColor: "#023020",
      backgroundColor: "#2E2016",
    },
    inner: {
      backgroundColor: themeColors.icon,
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
        onPress={onPress} // Handle the onPress function here
        // style={styles.buttonContainer}
        activeOpacity={1}
      >
        <View style={styles.button}>
          <View style={styles.outer}>
            <Animated.View style={[styles.height, heightStyle]}>
              <Animated.View style={[styles.inner, innerStyle]}>
                <Text style={styles.buttonText}>{title}</Text>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ThreeDButton;
