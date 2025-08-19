import * as React from "react";
import Svg, { Path } from "react-native-svg";

// Component for the first path configuration (left to center)
export const PathA = React.memo(() => (
  <Svg
    width="100%"
    height="100%"
    viewBox="0 0 300 200"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
  >
    <Path
      d="M130 290L0 160M0 200L150 50"
      stroke="#e1e6e3"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </Svg>
));

// Component for the second path configuration (center to right)
export const PathB = React.memo(() => (
  <Svg
    width="100%"
    height="100%"
    viewBox="0 0 300 200"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
  >
    <Path
      d="M150 50L300 200M300 160L105 350"
      stroke="#e1e6e3"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </Svg>
));
