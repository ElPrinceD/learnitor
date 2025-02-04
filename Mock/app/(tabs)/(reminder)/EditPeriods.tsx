import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants";
import AnimatedTextInput from "../../../components/AnimatedTextInput";
import GameButton from "../../../components/GameButton";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPeriod,
  updatePeriod,
  deletePeriod,
  getTimetable,
} from "../../../TimelineApiCalls";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";

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

const EditPeriodsPage: React.FC = () => {
  const { control, handleSubmit, setValue, watch } = useForm<{
    periods: Partial<Period>[];
  }>({
    defaultValues: { periods: [] },
  });
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userToken } = useAuth();
  const { timetableId } = useLocalSearchParams<{ timetableId: string }>();

  // Fetch all periods for the timetable
  const { data: fetchedPeriods, isLoading: fetchingPeriods } = useQuery<
    Period[],
    Error
  >({
    queryKey: ["periods", timetableId],
    queryFn: async () => {
      const timetable = await getTimetable(
        Number(timetableId),
        userToken?.token!
      );
      return timetable.periods;
    },
  });

  useEffect(() => {
    if (fetchedPeriods) {
      setPeriods(fetchedPeriods);
      fetchedPeriods.forEach((period, index) => {
        setValue(`periods.${index}.course_name`, period.course_name);
        setValue(`periods.${index}.lecturer`, period.lecturer);
        setValue(`periods.${index}.venue`, period.venue);
        setValue(`periods.${index}.days`, period.days);
        setValue(`periods.${index}.start_time`, period.start_time);
        setValue(`periods.${index}.end_time`, period.end_time);
      });
    }
    setIsLoading(false);
  }, [fetchedPeriods, setValue]);

  const updatePeriodMutation = useMutation({
    mutationFn: async (periodData: { id: number; data: Partial<Period> }) => {
      return updatePeriod(periodData.id, periodData.data, userToken?.token!);
    },
  });

  const deletePeriodMutation = useMutation({
    mutationFn: async (periodId: number) => {
      return deletePeriod(periodId, userToken?.token!);
    },
    onSuccess: (_, periodId) => {
      setPeriods((currentPeriods) =>
        currentPeriods.filter((p) => p.id !== periodId)
      );
    },
  });

  const handleUpdate = async () => {
    const updates = periods.map((period, index) => ({
      id: period.id,
      data: watch(`periods.${index}`),
    }));

    try {
      await Promise.all(
        updates.map((update) => updatePeriodMutation.mutateAsync(update))
      );
      router.back();
    } catch (error) {
      console.error("Error updating periods:", error);
    }
  };

  const handleDelete = async (periodId: number) => {
    await deletePeriodMutation.mutateAsync(periodId);
  };

  const renderPeriodFields = () =>
    periods.map((period, index) => (
      <View key={period.id} style={{ marginBottom: rV(20) }}>
        <Controller
          control={control}
          name={`periods.${index}.course_name`}
          render={({ field: { onChange, value } }) => (
            <AnimatedTextInput
              label={`Course Name (${period.days})`}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name={`periods.${index}.lecturer`}
          render={({ field: { onChange, value } }) => (
            <AnimatedTextInput
              label={`Lecturer (${period.days})`}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name={`periods.${index}.venue`}
          rules={{
            required: "Venue is required",
            minLength: {
              value: 1,
              message: "Venue must be at least 1 character",
            },
            maxLength: {
              value: 100,
              message: "Venue cannot exceed 100 characters",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <AnimatedTextInput
              label={`Venue (${period.days})`}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name={`periods.${index}.start_time`}
          render={({ field: { onChange, value } }) => (
            <CustomDateTimeSelector
              mode="time"
              label={`Start Time (${period.days})`}
              value={value}
              onTimeChange={onChange}
              buttonTitle="Pick Start Time"
            />
          )}
        />
        <Controller
          control={control}
          name={`periods.${index}.end_time`}
          render={({ field: { onChange, value } }) => (
            <CustomDateTimeSelector
              mode="time"
              label={`End Time (${period.days})`}
              value={value}
              onTimeChange={onChange}
              buttonTitle="Pick End Time"
            />
          )}
        />

        <GameButton
          onPress={() => handleDelete(period.id)}
          style={styles.deleteButton}
          title="Delete this period"
        />
      </View>
    ));

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
      justifyContent: "center", // Center the button
      marginTop: 20,
    },
    buttons: {
      width: rS(150),
      paddingVertical: rV(10),
      borderRadius: 10,
      alignSelf: "center",
    },
  });

  if (isLoading || fetchingPeriods) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderPeriodFields()}
      <View style={styles.buttonContainer}>
        <GameButton
          onPress={handleSubmit(handleUpdate)}
          style={styles.buttons}
          title="Update All"
        />
      </View>
    </ScrollView>
  );
};

export default EditPeriodsPage;
