import React, { memo } from "react";
import { ScrollView } from "react-native";

interface Props {
  children: React.ReactNode;
}

// Thin wrapper around the questions scroll area used by Game.tsx,
// SinglePlayerGame.tsx, and WeeklyExam.tsx. Extracted purely to drop the
// duplicated `<ScrollView style={{flex:1}} contentContainerStyle={{flexGrow:1}}>`
// from three different files.
const GameQuestionsScroll: React.FC<Props> = ({ children }) => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
    {children}
  </ScrollView>
);

export default memo(GameQuestionsScroll);
