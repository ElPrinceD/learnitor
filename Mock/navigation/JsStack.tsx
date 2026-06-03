import React from "react";
import { Easing } from "react-native";
import {
  createStackNavigator,
  StackNavigationOptions,
  StackNavigationEventMap,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { ParamListBase, StackNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";

const { Navigator } = createStackNavigator();

export const JsStack = withLayoutContext<
  StackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  StackNavigationEventMap
>(Navigator);

// Custom transition spec matching the tab transition speed and feel (140ms, out poly 4 easing)
export const fastTransitionSpec = {
  animation: "timing" as const,
  config: {
    duration: 140,
    easing: Easing.out(Easing.poly(4)),
  },
};

export const fastStackTransition: StackNavigationOptions = {
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: fastTransitionSpec,
    close: fastTransitionSpec,
  },
};

export const fastFadeStackTransition: StackNavigationOptions = {
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
  transitionSpec: {
    open: fastTransitionSpec,
    close: fastTransitionSpec,
  },
};
