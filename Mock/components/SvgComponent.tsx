import * as React from "react";
import Svg, { Path } from "react-native-svg";

// Component for the first path configuration
export const PathA = React.memo(() => (
  <Svg width="618" height="609" viewBox="0 0 550 585" fill="none">
    <Path d="M150 350L0 200M0 200L150 50" stroke="#e1e6e3" strokeWidth="4" />
  </Svg>
));

// Component for the second path configuration
export const PathB = React.memo(() => (
  <Svg width="618" height="609" viewBox="0 0 550 585" fill="none">
    <Path
      d="M150 50L300 200M300 200L150 350"
      stroke="#e1e6e3"
      strokeWidth="4"
    />
  </Svg>
));
