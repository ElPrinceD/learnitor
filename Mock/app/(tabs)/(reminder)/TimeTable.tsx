// CreateTimetablePage.tsx
import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  FlatList,
} from "react-native";
import Colors from "../../../constants/Colors";
import { rMS, rV } from "../../../constants";
import TimetableCreator from "../../../components/TimeTableCreator";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../QueryClient";
import { createTimetable, createPeriod } from "../../../TimelineApiCalls";
import { useAuth } from "../../../components/AuthContext";

interface Course {
  subject: string;
  teacher: string;
  days: string[];
  time: string;
  duration: string;
  endTime: string;
  startDate: string;
  endDate: string;
  venue: string;
}

const CreateTimetablePage: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [courses, setCourses] = useState<Course[]>([]);
  const { userToken } = useAuth();

  // Timetable related mutations
  const createTimetableMutation = useMutation<any, any, any>({
    mutationFn: async ({ timetableData, token }) =>
      createTimetable(timetableData, token),
    onSuccess: () => {
      // Invalidate any queries that depend on timetables
      queryClient.invalidateQueries({ queryKey: ["timetables"] });
    },
    onError: (error) => {
      setErrorMessage("Error creating timetable: " + error.message);
    },
  });

  const createPeriodMutation = useMutation<any, any, any>({
    mutationFn: async ({ periodData, token }) =>
      createPeriod(periodData, token),
    onSuccess: () => {
      // Invalidate any queries that depend on periods
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
    onError: (error) => {
      setErrorMessage("Error creating period: " + error.message);
    },
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingVertical: rV(25),
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: "timetableCreator" }]} // Single item to render TimetableCreator
        renderItem={() => (
          <TimetableCreator
            courses={courses}
            setCourses={setCourses}
            createTimetableMutation={createTimetableMutation}
            createPeriodMutation={createPeriodMutation}
          />
        )}
        keyExtractor={(item) => item.key}
      />
    </View>
  );
};

export default CreateTimetablePage;
