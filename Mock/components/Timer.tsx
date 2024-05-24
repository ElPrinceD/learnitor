import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';

interface TimerProps {
  duration: number;
  onComplete?: () => void;
  radius: number;
  strokeWidth: number;
  strokeColor: string;
}

const Timer: React.FC<TimerProps> = ({ duration, onComplete, radius, strokeWidth, strokeColor }) => {
  const [timer, setTimer] = useState(duration);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animationRef.current) {
      // If animation is already running, reset it
      animationRef.current.stop();
      animationRef.current = null;
    }

    const animation = Animated.timing(animatedValue, {
      toValue: 1,
      duration: timer * 1000, // Update duration based on current time
      easing: Easing.linear,
      useNativeDriver: true,
    });

    animationRef.current = animation;

    animation.start();

    const listener = animatedValue.addListener(({ value }) => {
      const remainingTime = Math.ceil((1 - value) * timer);
      setTimer(remainingTime);
      if (remainingTime === 0) {
        animation.stop();
        onComplete && onComplete();
      }
    });

    return () => {
      animation.stop();
      animatedValue.removeListener(listener);
    };
  }, [timer]);

  const spin = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.timer,
          {
            transform: [{ rotate: spin }],
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: strokeColor,
            borderTopColor: 'blue',
            borderRightColor: 'blue',
            position: 'absolute',
          },
        ]}
      />
      <Text style={styles.timerText}>{timer}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'blue',
    borderTopColor: "blue",
    borderRightColor: 'blue',
    position: 'absolute',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Timer;
