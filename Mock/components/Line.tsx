// Line.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

const Line = ({ width, height, backgroundColor, rotate }) => {
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
