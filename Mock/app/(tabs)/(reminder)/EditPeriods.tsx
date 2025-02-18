// pages/EditPeriodsPage.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput";
import GameButton from "../../../components/GameButton";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector";
import { useMutation } from "@tanstack/react-query";
import { updatePeriod, deletePeriod } from "../../../TimelineApiCalls";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../../components/AuthContext";

// This interface is used for the API (times as strings)
interface Period {
  id: number;
  course_name: string;
  lecturer: string;
  days: string;
  venue: string;
  start_time: string;
  end_time: string;
  timetable: number;
}

// Create a separate interface for form data where times are Dates.
interface PeriodFormData {
  course_name: string;
  lecturer: string;
  days: string;
  venue: string;
  start_time: Date;
  end_time: Date;
}

//
// Helper to parse a "HH:mm" string into a Date object using today's date.
//
const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

//
// Helper to format a Date object into a "HH:mm" string.
//
const formatTime = (date: Date): string => {
  // Ensure two-digit hours/minutes
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const EditPeriodsPage: React.FC = () => {
  const { control, handleSubmit, setValue } = useForm<PeriodFormData>({
    defaultValues: {},
  });
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [isLoading, setIsLoading] = useState(true);
  const { userToken } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  // Destructure period details from route.params (from your timetable edit action)
  const {
    periodId,
    periodCourseName,
    periodLecturer,
    periodStart,
    periodEnd,
    periodVenue,
    periodDays, // optional
  } = route.params as {
    periodId: number;
    periodCourseName: string;
    periodLecturer: string;
    periodStart: string;
    periodEnd: string;
    periodVenue: string;
    periodDays?: string;
  };

  // Populate the form with the new details.
  useEffect(() => {
    if (periodId) {
      setValue("course_name", periodCourseName);
      setValue("lecturer", periodLecturer);
      setValue("venue", periodVenue);
      setValue("start_time", parseTime(periodStart));
      setValue("end_time", parseTime(periodEnd));
      if (periodDays) {
        setValue("days", periodDays);
      }
      setIsLoading(false);
    }
  }, [
    periodId,
    periodCourseName,
    periodLecturer,
    periodVenue,
    periodStart,
    periodEnd,
    periodDays,
    setValue,
  ]);

  // Update period mutation using the periodId.
  // Note: updatePeriod expects the API data (with times as strings).
  const updatePeriodMutation = useMutation({
    mutationFn: async (periodData: Partial<Period>) => {
      return updatePeriod(periodId, periodData, userToken?.token!);
    },
    onSuccess: () => {
      navigation.goBack();
    },
  });

  const handleUpdate = async (data: PeriodFormData) => {
    try {
      // Convert Date objects to strings in the "HH:mm" format before sending.
      const updatedData: Partial<Period> = {
        course_name: data.course_name,
        lecturer: data.lecturer,
        venue: data.venue,
        days: data.days,
        start_time: formatTime(data.start_time),
        end_time: formatTime(data.end_time),
      };
      await updatePeriodMutation.mutateAsync(updatedData);
    } catch (error) {
      console.error("Error updating period:", error);
    }
  };

  // Delete period mutation using periodId.
  const handleDelete = async () => {
    try {
      await deletePeriod(periodId, userToken?.token!);
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting period:", error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: rV(15),
      paddingTop: rV(15),
    },
    deleteButton: {
      backgroundColor: themeColors.errorBackground,
      padding: rV(10),
      borderRadius: 10,
      marginTop: rV(10),
    },
    deleteButtonText: {
      color: themeColors.errorText,
      textAlign: "center",
    },
    buttonContainer: {
      justifyContent: "center",
      marginTop: 20,
    },
    buttons: {
      width: rS(150),
      paddingVertical: rV(10),
      borderRadius: 10,
      alignSelf: "center",
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Controller
        control={control}
        name="course_name"
        render={({ field: { onChange, value } }) => (
          <AnimatedRoundTextInput
            label="Course Name"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="lecturer"
        render={({ field: { onChange, value } }) => (
          <AnimatedRoundTextInput
            label="Lecturer"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="venue"
        render={({ field: { onChange, value } }) => (
          <AnimatedRoundTextInput
            label="Venue"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="days"
        render={({ field: { onChange, value } }) => (
          <AnimatedRoundTextInput
            label="Days"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="start_time"
        render={({ field: { onChange, value } }) => (
          <CustomDateTimeSelector
            mode="time"
            label="Start Time"
            value={value}
            onTimeChange={onChange}
            buttonTitle="Pick Start Time"
          />
        )}
      />
      <Controller
        control={control}
        name="end_time"
        render={({ field: { onChange, value } }) => (
          <CustomDateTimeSelector
            mode="time"
            label="End Time"
            value={value}
            onTimeChange={onChange}
            buttonTitle="Pick End Time"
          />
        )}
      />
      <View style={styles.buttonContainer}>
        <GameButton
          onPress={handleSubmit(handleUpdate)}
          style={styles.buttons}
          title="Update"
        />
        <GameButton
          onPress={handleDelete}
          style={styles.deleteButton}
          title="Delete"
        />
      </View>
    </ScrollView>
  );
};

export default EditPeriodsPage;
