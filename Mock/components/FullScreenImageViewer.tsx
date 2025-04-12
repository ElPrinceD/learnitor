import React, { useEffect } from "react";
import { Modal, View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  type PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import AppImage from "./AppImage"; // Adjust path as needed

const { width, height } = Dimensions.get("window");

type FullScreenImageViewerProps = {
  visible: boolean;
  images: string[];
  currentIndex: number;
  onRequestClose: () => void;
};

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  images,
  currentIndex: initialIndex,
  onRequestClose,
}) => {
  // React state for the active image index.
  const [currentIndexState, setCurrentIndexState] = React.useState(initialIndex);
  // Shared values for animation and gesture handling.
  const currentIndex = useSharedValue(initialIndex);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeOffsetX = useSharedValue(0);

  // When modal opens, reset all values.
  useEffect(() => {
    setCurrentIndexState(initialIndex);
    currentIndex.value = initialIndex;
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    swipeOffsetX.value = 0;
  }, [visible, initialIndex]);

  /**
   * Pan Gesture Handler:
   * - When zoomed in (scale > 1): allows panning within the zoomed image.
   * - When not zoomed (scale === 1): handles horizontal swiping between images,
   *   and a downward vertical swipe (if translationY exceeds threshold) dismisses the viewer.
   */
  const panGesture = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      // Save start values depending on whether the image is zoomed.
      ctx.startX = scale.value > 1 ? translateX.value : swipeOffsetX.value;
      ctx.startY = scale.value > 1 ? translateY.value : 0;
    },
    onActive: (event, ctx) => {
      if (scale.value > 1) {
        translateX.value = ctx.startX + event.translationX;
        translateY.value = ctx.startY + event.translationY;
      } else {
        swipeOffsetX.value = ctx.startX + event.translationX;
        // For vertical translation, apply translateY to simulate image dragging.
        translateY.value = event.translationY;
      }
    },
    onEnd: (event) => {
      if (scale.value > 1) {
        // When zoomed, allow smooth panning within the limits.
        translateX.value = withSpring(translateX.value);
        translateY.value = withSpring(translateY.value);
      } else {
        // Check if vertical swipe downward exceeds a threshold.
        if (event.translationY > 100 && Math.abs(event.translationX) < 50) {
          // Dismiss the viewer.
          runOnJS(onRequestClose)();
          return;
        }
        // Otherwise, check for horizontal swipes.
        if (Math.abs(swipeOffsetX.value) > 50) {
          let newIndex = currentIndex.value;
          if (swipeOffsetX.value > 0 && currentIndex.value > 0) {
            newIndex = currentIndex.value - 1;
          } else if (swipeOffsetX.value < 0 && currentIndex.value < images.length - 1) {
            newIndex = currentIndex.value + 1;
          }
          // If the index changes, update both the shared value and React state.
          if (newIndex !== currentIndex.value) {
            currentIndex.value = newIndex;
            runOnJS(setCurrentIndexState)(newIndex);
          }
        }
        // Return to initial position for horizontal and vertical translations.
        swipeOffsetX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  /**
   * Pinch Gesture Handler:
   * - Allows smooth zooming with limits.
   */
  const pinchGesture = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startScale: number }
  >({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = ctx.startScale * event.scale;
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else if (scale.value > 5) {
        scale.value = withSpring(5);
      }
    },
  });

  /**
   * Double Tap Gesture Handler:
   * - Toggles between zoomed in and reset.
   */
  const doubleTapGesture = useAnimatedGestureHandler({
    onActive: () => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        scale.value = withSpring(2);
      }
    },
  });

  // Animated styles that merge swiping, panning, and scaling transforms.
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: swipeOffsetX.value + translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Modal visible={visible} transparent onRequestClose={onRequestClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onRequestClose}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {/* Pan Gesture Handler wraps the view for swiping and vertical dismissal */}
          <PanGestureHandler onGestureEvent={panGesture}>
            <Animated.View style={{ flex: 1 }}>
              {/* Pinch Gesture Handler for zooming */}
              <PinchGestureHandler onGestureEvent={pinchGesture}>
                <Animated.View style={{ flex: 1 }}>
                  {/* Double Tap Handler for toggling zoom */}
                  <TapGestureHandler onGestureEvent={doubleTapGesture} numberOfTaps={2}>
                    <Animated.View style={[styles.imageContainer, animatedStyle]}>
                      <AppImage uri={images[currentIndexState]} style={styles.fullImage} />
                    </Animated.View>
                  </TapGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default FullScreenImageViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: width,
    height: height,
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
  },
});
