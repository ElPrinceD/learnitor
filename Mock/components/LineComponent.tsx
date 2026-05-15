// LineComponent.js
import React from 'react';
import { Svg, Line } from 'react-native-svg';

interface LineComponentProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const LineComponent = ({ x1, y1, x2, y2 }: LineComponentProps) => (
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