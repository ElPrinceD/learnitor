import { useColorScheme as useColorSchemeNative } from "react-native";
import { ColorSchemeName } from "react-native";

export function useColorScheme(): ColorSchemeName {
  return useColorSchemeNative();
}
