import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from "react-native";

const ThreeDButton = ({ title, onPress }) => {
  const [animatedValue] = useState(new Animated.Value(0));

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

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    height: 60,
    width: 70,
  },
  outer: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#5f9ea0",
  },
  height: {
    borderRadius: 16,
    backgroundColor: "#008b8b",
  },
  inner: {
    backgroundColor: "#00ffff",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
});

export default ThreeDButton;
