import React from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GameAudioProvider } from "../../contexts/GameAudioContext";
import { JsStack, fastStackTransition } from "../../navigation/JsStack";
import { CardStyleInterpolators } from "@react-navigation/stack";

export default function GameLayout() {
  return (
    <BottomSheetModalProvider>
    <GameAudioProvider>
    <JsStack
      initialRouteName="GameIntro"
      screenOptions={{
        headerShown: false,
        ...fastStackTransition,
      }}
    >
      <JsStack.Screen
        name="GameIntro"
        options={{ gestureEnabled: true }}
      />
      <JsStack.Screen
        name="GameCourses"
        options={{ gestureEnabled: true }}
      />
      <JsStack.Screen name="GameTopics" />
      <JsStack.Screen name="GameWaiting" />
      <JsStack.Screen name="GameLevel" />
      <JsStack.Screen
        name="Results"
        options={{
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      />
      <JsStack.Screen
        name="Game"
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      />
      <JsStack.Screen
        name="SinglePlayerGame"
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      />
      <JsStack.Screen name="Leaderboard" options={{ gestureEnabled: true }} />
      <JsStack.Screen
        name="LeaderboardDetail"
        options={{ gestureEnabled: true }}
      />
      <JsStack.Screen
        name="WeeklyExamIntro"
        options={{ gestureEnabled: true }}
      />
      <JsStack.Screen
        name="WeeklyExam"
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      />
      <JsStack.Screen
        name="SquadSettings"
        options={{ gestureEnabled: true }}
      />
    </JsStack>
    </GameAudioProvider>
    </BottomSheetModalProvider>
  );
}

