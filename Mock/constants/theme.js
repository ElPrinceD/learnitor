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
    light: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 1,
    },
    small: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 8,
    },
    extraLarge: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 12,
    },
  };
};

export { COLORS, FONT, SIZES, useShadows };
