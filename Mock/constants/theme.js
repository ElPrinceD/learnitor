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
  regular: "Nunito-Regular",
  medium: "Nunito-SemiBold",
  bold: "Nunito-Bold",
};



const SIZES = {
  xSmall: rMS(5),
  small: rMS(10),
  medium: rMS(15),
  large: rMS(17),
  xLarge: rMS(25),
  xxLarge: rMS(30),
  xxxLarge: rMS(45)
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
