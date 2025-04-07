import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import {
  PinchGestureHandler,
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import AppImage from "./AppImage"; // Adjust the path as needed

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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Animated values for pinch zoom
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastOffset = useRef({ x: 0, y: 0 });

  // Animated values for panning (swipe gestures)
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Reset zoom and pan state
  const resetZoom = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    lastScale.current = 1;
    lastOffset.current = { x: 0, y: 0 };
  };

  // When the modal becomes visible, set the current index and reset zoom.
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [visible, initialIndex]);

  // Listen to scale changes to set zoom flag.
  useEffect(() => {
    const listenerId = scale.addListener(({ value }) => {
      setIsZoomed(value !== 1);
    });
    return () => {
      scale.removeListener(listenerId);
    };
  }, []);

  // Horizontal and vertical pan gestures
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (event: {
    nativeEvent: {
      state: number;
      translationX: number;
      translationY: number;
      velocityX: number;
    };
  }) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;
      const swipeThreshold = 50;
      const verticalThreshold = 50;

      // If swiped down sufficiently and not zoomed, dismiss viewer.
      if (translationY > 100 && !isZoomed) {
        onRequestClose();
        return;
      }

      // If horizontal swipe is significant and vertical movement is minimal.
      if (Math.abs(translationX) > swipeThreshold && Math.abs(translationY) < verticalThreshold) {
        if (translationX > swipeThreshold && currentIndex > 0) {
          Animated.timing(panX, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex((prev) => prev - 1);
            panX.setValue(0);
          });
        } else if (translationX < -swipeThreshold && currentIndex < images.length - 1) {
          Animated.timing(panX, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex((prev) => prev + 1);
            panX.setValue(0);
          });
        } else {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
        }
      } else {
        Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
      }
      Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event: {
    nativeEvent: { oldState: number; scale: number };
  }) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      scale.setValue(lastScale.current);

      const newOffsetX = lastOffset.current.x * event.nativeEvent.scale;
      const newOffsetY = lastOffset.current.y * event.nativeEvent.scale;
      translateX.setValue(newOffsetX);
      translateY.setValue(newOffsetY);
      lastOffset.current = { x: newOffsetX, y: newOffsetY };

      if (lastScale.current < 1) {
        resetZoom();
      } else if (lastScale.current > 5) {
        Animated.spring(scale, { toValue: 5, useNativeDriver: true }).start();
        lastScale.current = 5;
      }
    }
  };

  const onDoubleTap = () => {
    if (lastScale.current > 1) {
      resetZoom();
    } else {
      Animated.spring(scale, { toValue: 2, useNativeDriver: true }).start();
      lastScale.current = 2;
    }
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onRequestClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onRequestClose}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <PanGestureHandler
            onGestureEvent={isZoomed ? () => {} : onPanGestureEvent}
            onHandlerStateChange={isZoomed ? () => {} : onPanStateChange}
            enabled={!isZoomed}
          >
            <Animated.View
              style={{
                transform: [{ translateX: panX }, { translateY: panY }],
              }}
            >
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View
                  style={{
                    transform: [{ scale }, { translateX }, { translateY }],
                  }}
                >
                  <TouchableWithoutFeedback onPress={onDoubleTap}>
                    <AppImage
                      uri={images[currentIndex]}
                      style={styles.fullImage}
                    />
                  </TouchableWithoutFeedback>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width,
    height,
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default FullScreenImageViewer;
