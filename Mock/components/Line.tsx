// Line.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LineProps {
    width: number;
    height: number;
    backgroundColor: string;
    rotate: number;
}

const Line = ({ width, height, backgroundColor, rotate }: LineProps) => {
  const styles = StyleSheet.create({
    line: {
      position: 'absolute',
      width: width,
      height: height,
      backgroundColor: backgroundColor,
      transform: [{ rotate: `${rotate}deg` }],
    },
  });

  return <View style={styles.line} />;
};

export default Line;
