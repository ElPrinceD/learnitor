import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function SvgComponent({ paths }) {
  return (
    <Svg width="618" height="609" viewBox="0 0 550 585" fill="none">
      {paths.map((path, index) => (
        <Path key={index} d={path} stroke="#e1e6e3" strokeWidth="4" />
      ))}
    </Svg>
  );
}