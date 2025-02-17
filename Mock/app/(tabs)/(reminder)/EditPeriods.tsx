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
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput";
import GameButton from "../../../components/GameButton";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector";
import { useMutation } from "@tanstack/react-query";
import { updatePeriod, deletePeriod } from "../../../TimelineApiCalls";
import { useNavigation, useRoute } from "@react-navigation/native";
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
  const { control, handleSubmit, setValue } = useForm<Partial<Period>>({
    defaultValues: {},
  });
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [isLoading, setIsLoading] = useState(true);
  const { userToken } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { period } = route.params as { period: Period };

  useEffect(() => {
    if (period) {
      setValue("course_name", period.course_name);
      setValue("lecturer", period.lecturer);
      setValue("venue", period.venue);
      setValue("days", period.days);
      setValue("start_time", period.start_time);
      setValue("end_time", period.end_time);
      setIsLoading(false);
    }
  }, [period, setValue]);

  const updatePeriodMutation = useMutation({
    mutationFn: async (periodData: Partial<Period>) => {
      return updatePeriod(period.id, periodData, userToken?.token!);
    },
    onSuccess: () => {
      navigation.goBack();
    },
  });

  const handleUpdate = async (data: Partial<Period>) => {
    try {
      await updatePeriodMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error updating period:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePeriod(period.id, userToken?.token!);
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