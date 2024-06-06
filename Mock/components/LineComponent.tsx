// LineComponent.js
import React from 'react';
import { Svg, Line } from 'react-native-svg';

const LineComponent = ({ x1, y1, x2, y2 }) => (
  <Svg height="100%" width="100%">
    <Line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="grey"
      strokeWidth="2"
    />
  </Svg>
);

export default LineComponent;