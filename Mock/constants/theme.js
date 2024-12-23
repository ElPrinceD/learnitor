import {
  useResponsiveHeight,
  useResponsiveWidth, useResponsiveFontSize
} from "react-native-responsive-dimensions";
import { rMS } from "./responsive";
import { useColorScheme } from "react-native";
import Colors from "./Colors";


const COLORS = {
  primary: "#312651",
  secondary: "#444262",
  tertiary: "#FF7754",

  gray: "#83829A",
  gray2: "#C1C0C8",

  white: "#F3F4F8",
  lightWhite: "#FAFAFC",
};

const FONT = {
  regular: "DMRegular",
  medium: "DMMedium",
  bold: "DMBold",
};

const SIZES = {
  xSmall: rMS(4),
  small: rMS(8),
  medium: rMS(16),
  large: rMS(28),
  xLarge: rMS(32),
  xxLarge: rMS(40),
  xxxLarge: rMS(48)
};

const useShadows = () => {
const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  
  return {
    small: {
      shadowColor: themeColors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: themeColors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 5.84,
      elevation: 5,
    },
  };
};

export { COLORS, FONT, SIZES, useShadows };
