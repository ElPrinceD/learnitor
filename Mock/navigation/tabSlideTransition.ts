import { Dimensions, Easing } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

type BottomTabSceneInterpolationProps = Parameters<
  NonNullable<BottomTabNavigationOptions["sceneStyleInterpolator"]>
>[0];
type BottomTabSceneInterpolatedStyle = ReturnType<
  NonNullable<BottomTabNavigationOptions["sceneStyleInterpolator"]>
>;
type TransitionSpec = NonNullable<BottomTabNavigationOptions["transitionSpec"]>;

const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * Full-width horizontal slide between bottom tabs.
 * current.progress: -1 (left of active), 0 (active), 1 (right of active)
 */
export function forHorizontalTabSlide({
  current,
}: BottomTabSceneInterpolationProps): BottomTabSceneInterpolatedStyle {
  return {
    sceneStyle: {
      overflow: "hidden",
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          }),
        },
      ],
    },
  };
}

export const horizontalTabTransitionSpec: TransitionSpec = {
  animation: "timing",
  config: {
    duration: 140,
    easing: Easing.out(Easing.poly(4)),
  },
};

export const horizontalTabTransition = {
  sceneStyleInterpolator: forHorizontalTabSlide,
  transitionSpec: horizontalTabTransitionSpec,
};
