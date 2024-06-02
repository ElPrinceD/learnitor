import React from "react";
import { StyleSheet, Image, Animated } from "react-native";
import { MAX_HEADER_HEIGHT } from "./Model";

interface AnimatedImageProps {
  uri: string;
  opacity: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
  MAX_HEADER_HEIGHT: number;
}

const AnimatedImage: React.FC<AnimatedImageProps> = ({
  uri,
  opacity,
  translateY,
  MAX_HEADER_HEIGHT,
}) => {
  return (
    <Animated.View
      style={[
        styles.imageContainer,
        {
          opacity: opacity,
          transform: [{ translateY: translateY }],
        },
      ]}
    >
      <Image
        source={{ uri }}
        style={[styles.image, { height: MAX_HEADER_HEIGHT }]}
        resizeMode="cover"
        onError={(error) => console.log("Image error:", error)}
      />
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "black",
          opacity: opacity,
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    height: MAX_HEADER_HEIGHT,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
});

export default AnimatedImage;
