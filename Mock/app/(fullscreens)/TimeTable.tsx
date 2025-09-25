import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import {
  createPeriod,
  createTimetable,
  updateTimetable,
} from "../../services/TimelineApiCalls";
import { useAuth } from "../../components/AuthContext";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import Colors from "../../constants/Colors";
import { rS, rV, rMS } from "../../constants";
import AnimatedRoundTextInput from "../../components/AnimatedRoundTextInput";
import GameButton from "../../components/GameButton";
import CustomDateTimeSelector from "../../components/CustomDateTimeSelector";
import { useRoute } from "@react-navigation/native";

interface Period {
  id?: string;
  course_name: string;
  lecturer: string;
  venue: string;
  days: string; // Long form
  start_time: Date; // Changed to Date for form control
  end_time: Date; // Changed to Date for form control
  timetable?: number;
}

interface TimetableData {
  name: string;
  description: string;
  id?: number;
}

interface FormValues {
  name: string;
  description: string;
  start_time: Date;
  end_time: Date;
}

type RouteParams = {
  id: string;
};

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dayMapping: { [key: string]: string } = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const reverseDayMapping: { [key: string]: string } = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const CreateTimetablePage: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as RouteParams;
  const { userToken, userInfo } = useAuth();
  const params = useLocalSearchParams<{
    timetable?: string;
    periods?: string;
  }>();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      start_time: new Date(),
      end_time: new Date(),
    },
  });

  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string>("Monday");
  const [newPeriod, setNewPeriod] = useState<Period>({
    course_name: "",
    lecturer: "",
    venue: "",
    days: "Monday",
    start_time: new Date(),
    end_time: new Date(),
  });
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { timetable, periods: periodsParam } = params;

  useEffect(() => {
    if (timetable) {
      setIsEditMode(true);

      const timetableData = JSON.parse(timetable);
      console.log(timetableData);
      setValue("name", timetableData.name);
      setValue("description", timetableData.description || "");

      if (periodsParam) {
        const parsedPeriods = JSON.parse(periodsParam).map((p: any) => ({
          ...p,
          start_time: parseTime(p.start_time), // Assuming p.start_time is in "HH:mm" format
          end_time: parseTime(p.end_time), // Assuming p.end_time is in "HH:mm" format
        }));
        setPeriods(parsedPeriods);
        console.log(parsedPeriods);
      }

      navigation.setOptions({ title: "Edit Timetable" });
    } else {
      navigation.setOptions({ title: "Create Timetable" });
    }
  }, [timetable, periodsParam, navigation, setValue]);

  // Initial state for newPeriod should not be set with parsed data when editing

  const parseTime = (timeString: string): Date => {
    if (!timeString) return new Date(); // or handle this case appropriately
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    if (!(date instanceof Date)) return "00:00"; // or handle this case appropriately
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const createTimetableMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string;
      created_by: number;
      community: string;
    }) => createTimetable(payload, userToken?.token ?? ""),
    onSuccess: (data) => {
      const timetableId = data.id;
      const finalPeriods = periods.map((p) => ({
        ...p,
        timetable: timetableId,
        start_time: formatTime(p.start_time),
        end_time: formatTime(p.end_time),
      })) as any[];
      createPeriodMutation.mutate(finalPeriods);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || "Error creating timetable");
      setIsLoading(false);
    },
  });

  const updateTimetableMutation = useMutation({
    mutationFn: async (payload: {
      id: number;
      name: string;
      description: string;
    }) =>
      updateTimetable(
        payload.id,
        payload.name,
        payload.description,
        userToken?.token
      ),
    onSuccess: () => {
      setIsLoading(false);
      Alert.alert(
        "Success",
        "Timetable updated successfully! Your changes have been saved.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || "Error updating timetable");
      setIsLoading(false);
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: async (payload: Period[]) => {
      return createPeriod(payload, userToken?.token ?? "");
    },
    onSuccess: () => {
      setIsLoading(false);
      Alert.alert(
        "Success",
        "Timetable created successfully! You can now view it in your timetables list.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || "Error creating periods");
      setIsLoading(false);
    },
  });

  const handleCreateTimetable = useCallback(
    (formData: FormValues) => {
      // Clear previous errors
      setErrorMessage(null);

      // Validate form data
      if (!formData.name.trim()) {
        setErrorMessage("Please provide a name for the timetable.");
        return;
      }

      if (formData.name.trim().length < 3) {
        setErrorMessage("Timetable name must be at least 3 characters long.");
        return;
      }

      if (periods.length === 0) {
        setErrorMessage("Please add at least one period to the timetable.");
        return;
      }

      setIsLoading(true);

      if (isEditMode) {
        updateTimetableMutation.mutate({
          id: Number(id),
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
      } else {
        createTimetableMutation.mutate({
          name: formData.name.trim(),
          description: formData.description.trim(),
          created_by: userInfo?.user?.id ?? 0,
          community: id!,
        });
      }
    },
    [
      isEditMode,
      id,
      userInfo?.user?.id,
      periods.length,
      updateTimetableMutation,
      createTimetableMutation,
    ]
  );

  const handleAddOrUpdatePeriod = useCallback(() => {
    const start_time = watch("start_time");
    const end_time = watch("end_time");

    // Clear previous errors
    setErrorMessage(null);

    // Validate required fields
    if (!newPeriod.course_name.trim()) {
      setErrorMessage("Course name is required.");
      return;
    }
    if (!newPeriod.lecturer.trim()) {
      setErrorMessage("Lecturer name is required.");
      return;
    }
    if (!newPeriod.venue.trim()) {
      setErrorMessage("Venue is required.");
      return;
    }

    // Validate times
    if (!start_time || !end_time) {
      setErrorMessage("Please select both start and end times.");
      return;
    }

    if (start_time >= end_time) {
      setErrorMessage("End time must be after start time.");
      return;
    }

    // Check for overlapping periods on the same day
    const hasOverlap = periods.some((period) => {
      if (period.days !== newPeriod.days || period.id === editingPeriodId)
        return false;

      const existingStart = new Date(period.start_time);
      const existingEnd = new Date(period.end_time);

      return start_time < existingEnd && end_time > existingStart;
    });

    if (hasOverlap) {
      setErrorMessage(
        "This time period overlaps with an existing period on the same day."
      );
      return;
    }

    const updatedPeriod: Period = {
      ...newPeriod,
      start_time: start_time,
      end_time: end_time,
    };

    if (editingPeriodId) {
      setPeriods((prev) =>
        prev.map((period) =>
          period.id === editingPeriodId
            ? { ...updatedPeriod, id: editingPeriodId }
            : period
        )
      );
      setEditingPeriodId(null);
    } else {
      const newPeriodWithId = { ...updatedPeriod, id: Date.now().toString() };
      setPeriods((prev) => [...prev, newPeriodWithId]);
    }

    // Reset form
    setNewPeriod({
      course_name: "",
      lecturer: "",
      venue: "",
      days: currentDay,
      start_time: new Date(),
      end_time: new Date(),
    });

    // Reset form values
    setValue("start_time", new Date());
    setValue("end_time", new Date());
  }, [newPeriod, watch, periods, editingPeriodId, currentDay, setValue]);

  const handleEditPeriod = useCallback(
    (period: Period) => {
      setEditingPeriodId(period.id || null);
      setNewPeriod(period);
      setCurrentDay(period.days);
      setValue("start_time", period.start_time);
      setValue("end_time", period.end_time);
      setErrorMessage(null); // Clear any previous errors
    },
    [setValue]
  );

  const deletePeriod = useCallback(
    (id?: string) => {
      if (!id) return;
      Alert.alert(
        "Delete Period",
        "Are you sure you want to delete this period? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            onPress: () => {
              setPeriods((prev) => prev.filter((p) => p.id !== id));
              if (editingPeriodId === id) {
                setEditingPeriodId(null);
                setNewPeriod({
                  course_name: "",
                  lecturer: "",
                  venue: "",
                  days: currentDay,
                  start_time: new Date(),
                  end_time: new Date(),
                });
                setValue("start_time", new Date());
                setValue("end_time", new Date());
              }
              setErrorMessage(null);
            },
            style: "destructive",
          },
        ]
      );
    },
    [editingPeriodId, currentDay, setValue]
  );

  const filteredPeriods = useMemo(
    () => periods.filter((p) => p.days === currentDay),
    [periods, currentDay]
  );

  const cancelEdit = useCallback(() => {
    setEditingPeriodId(null);
    setNewPeriod({
      course_name: "",
      lecturer: "",
      venue: "",
      days: currentDay,
      start_time: new Date(),
      end_time: new Date(),
    });
    setValue("start_time", new Date());
    setValue("end_time", new Date());
    setErrorMessage(null);
  }, [currentDay, setValue]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rV(15),
    },
    sectionContainer: {
      backgroundColor: themeColors.secondaryBackground,
      padding: rV(15),
      borderRadius: rMS(8),
      marginBottom: rV(15),
    },
    sectionHeader: {
      fontSize: rMS(16),
      fontWeight: "bold",
      marginBottom: rV(10),
      color: themeColors.text,
    },
    progressBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rV(10),
      marginBottom: rV(15),
    },
    dayProgressChip: {
      borderWidth: rS(0.5),
      borderColor: themeColors.text,
      borderRadius: rMS(4),
      paddingHorizontal: rS(7),
      paddingVertical: rV(5),
      marginHorizontal: rS(2),
      flexDirection: "row",
      alignItems: "center",
    },
    activeDayChip: {
      backgroundColor: Colors.light.tint,
    },
    dayChipText: {
      fontSize: rMS(14),
      color: themeColors.text,
    },
    checkMark: {
      marginLeft: rS(5),
      color: "green",
      fontSize: rMS(14),
    },
    progressBarLine: {
      height: 2,
      flex: 1,
      backgroundColor: themeColors.text,
      marginHorizontal: rS(1),
    },
    dayHeaderContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: rV(10),
    },
    subtitle: {
      fontSize: rMS(18),
      fontWeight: "bold",
      color: themeColors.text,
    },
    periodCount: {
      fontSize: rMS(14),
      color: themeColors.textSecondary,
      backgroundColor: themeColors.tint + "20",
      paddingHorizontal: rS(8),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
    },
    noPeriodsText: {
      fontSize: rMS(14),
      color: themeColors.textSecondary,
      marginVertical: rV(10),
    },
    periodItem: {
      backgroundColor: themeColors.secondaryBackground,
      padding: rMS(10),
      borderRadius: rMS(8),
      marginBottom: rV(10),
    },
    periodRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    periodInfo: {
      flex: 1,
      color: themeColors.text,
    },
    periodText: {
      fontSize: rMS(14),
      fontWeight: "600",
      color: themeColors.text,
    },
    periodLecturer: {
      fontSize: rMS(12),
      color: themeColors.text,
    },
    periodVenue: {
      fontSize: rMS(12),
      color: "#666",
    },
    periodActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    editText: {
      color: "blue",
      marginRight: rS(10),
      fontSize: rMS(14),
    },
    deleteText: {
      color: "red",
      fontSize: rMS(14),
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: rV(10),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.buttonDisabled,
    },
    timeText: {
      fontSize: rMS(16),
      color: themeColors.text,
    },
    arrow: {
      fontSize: rMS(20),
      color: themeColors.text,
    },
    errorContainer: {
      backgroundColor: themeColors.errorBackground || "#ffebee",
      padding: rV(12),
      borderRadius: rMS(8),
      marginTop: rV(10),
      borderLeftWidth: 4,
      borderLeftColor: themeColors.errorText || "#f44336",
    },
    errorText: {
      color: themeColors.errorText || "#f44336",
      fontSize: rMS(14),
      fontWeight: "500",
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.2)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 20,
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: rV(20) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Timetable Details</Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Timetable name is required" }}
              render={({ field: { onChange, value } }) => (
                <AnimatedRoundTextInput
                  label="Timetable Name"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <AnimatedRoundTextInput
                  label="Description (optional)"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          <View style={{ alignItems: "center" }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.progressBarContainer,
                { justifyContent: "center" },
              ]}
            >
              {daysOfWeek.map((shortDay, index) => {
                const longDay = dayMapping[shortDay];
                const dayCompleted =
                  periods.filter((p) => p.days === longDay).length > 0;
                return (
                  <React.Fragment key={shortDay}>
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentDay(longDay);
                        setNewPeriod((prev) => ({ ...prev, days: longDay }));
                      }}
                    >
                      <View
                        style={[
                          styles.dayProgressChip,
                          currentDay === longDay && styles.activeDayChip,
                        ]}
                      >
                        <Text style={styles.dayChipText}>{shortDay}</Text>
                        {dayCompleted && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    {index < daysOfWeek.length - 1 && (
                      <View style={styles.progressBarLine} />
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.dayHeaderContainer}>
            <Text style={styles.subtitle}>
              Periods for {reverseDayMapping[currentDay]}
            </Text>
            <Text style={styles.periodCount}>
              {filteredPeriods.length} period
              {filteredPeriods.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Always show the form to add periods */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Add New Period</Text>
            <AnimatedRoundTextInput
              label="Course Name"
              value={newPeriod.course_name}
              onChangeText={(text) =>
                setNewPeriod({ ...newPeriod, course_name: text })
              }
            />
            <AnimatedRoundTextInput
              label="Lecturer Name"
              value={newPeriod.lecturer}
              onChangeText={(text) =>
                setNewPeriod({ ...newPeriod, lecturer: text })
              }
            />
            <AnimatedRoundTextInput
              label="Venue"
              value={newPeriod.venue}
              onChangeText={(text) =>
                setNewPeriod({ ...newPeriod, venue: text })
              }
            />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Select Times</Text>
            <Controller
              control={control}
              name="start_time"
              render={({ field: { onChange, value } }) => (
                <CustomDateTimeSelector
                  mode="time"
                  label="Start Time"
                  value={formatTime(value)}
                  onTimeChange={(time) => {
                    onChange(parseTime(time));
                    if (!isEditMode) {
                      setNewPeriod({
                        ...newPeriod,
                        start_time: parseTime(time),
                      });
                    }
                  }}
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
                  value={formatTime(value)}
                  onTimeChange={(time) => {
                    onChange(parseTime(time));
                    if (!isEditMode) {
                      setNewPeriod({
                        ...newPeriod,
                        end_time: parseTime(time),
                      });
                    }
                  }}
                  buttonTitle="Pick End Time"
                />
              )}
            />
          </View>

          <View style={{ marginTop: rV(20) }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              {editingPeriodId && (
                <GameButton
                  title="Cancel"
                  onPress={cancelEdit}
                  style={{
                    backgroundColor: themeColors.textSecondary,
                    flex: 0.4,
                  }}
                />
              )}
              <GameButton
                title={editingPeriodId ? "Update Period" : "Add Period"}
                onPress={handleAddOrUpdatePeriod}
                style={{ flex: editingPeriodId ? 0.55 : 1 }}
              />
            </View>
            <View style={{ width: "100%", marginTop: rV(20) }}>
              <GameButton
                title={isLoading ? "Saving..." : "Save Timetable"}
                onPress={handleSubmit(handleCreateTimetable)}
                disabled={isLoading}
                style={{ width: "100%" }}
              />
            </View>
          </View>

          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Show existing periods if any */}
          {filteredPeriods.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Existing Periods</Text>
              {filteredPeriods.map((item) => (
                <View key={item.id} style={styles.periodItem}>
                  <View style={styles.periodRow}>
                    <View style={styles.periodInfo}>
                      <Text style={styles.periodText}>
                        {item.course_name} ({formatTime(item.start_time)} -{" "}
                        {formatTime(item.end_time)})
                      </Text>
                      <Text style={styles.periodLecturer}>{item.lecturer}</Text>
                      <Text style={styles.periodVenue}>{item.venue}</Text>
                    </View>
                    <View style={styles.periodActions}>
                      <TouchableOpacity onPress={() => handleEditPeriod(item)}>
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deletePeriod(item.id)}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Show message when no periods exist */}
          {filteredPeriods.length === 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.noPeriodsText}>
                No periods added for {reverseDayMapping[currentDay]} yet.
              </Text>
            </View>
          )}
        </ScrollView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={themeColors.tint} />
            <Text style={{ color: themeColors.text, marginTop: 10 }}>
              {isEditMode ? "Updating..." : "Creating..."}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateTimetablePage;
