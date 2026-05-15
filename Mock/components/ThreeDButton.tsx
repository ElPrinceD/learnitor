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
import { rMS, rS, rV } from "../constants";

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
      backgroundColor: "#002968",
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 9 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 5,
    },
    height: {
      borderRadius: 15,
      backgroundColor: "#001a43",
    },
    inner: {
      backgroundColor: "#00378a",
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
                  <Play size={rMS(20)} color="#000" fill= {themeColors.tint} />
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