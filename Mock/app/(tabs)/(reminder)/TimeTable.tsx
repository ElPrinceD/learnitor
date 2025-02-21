import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { createPeriod, createTimetable, updateTimetable } from "../../../TimelineApiCalls";
import { useAuth } from "../../../components/AuthContext";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import Colors from "../../../constants/Colors";
import { rS, rV, rMS } from "../../../constants";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput";
import GameButton from "../../../components/GameButton";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector";
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
  const params = useLocalSearchParams<{ timetable?: string; periods?: string }>();
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
      console.log(timetableData)
      setValue("name", timetableData.name);
      setValue("description", timetableData.description || "");
      
      if (periodsParam) {
        const parsedPeriods = JSON.parse(periodsParam).map((p: any) => ({
          ...p,
          start_time: parseTime(p.start_time), // Assuming p.start_time is in "HH:mm" format
          end_time: parseTime(p.end_time),     // Assuming p.end_time is in "HH:mm" format
        }));
        setPeriods(parsedPeriods);
        console.log(parsedPeriods)
      }
    
      navigation.setOptions({ title: 'Edit Timetable' });
    } else {
      navigation.setOptions({ title: 'Create Timetable' });
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
    }) =>
      createTimetable(payload, userToken?.token ?? ""),
    onSuccess: (data) => {
      const timetableId = data.id;
      const finalPeriods = periods.map((p) => ({
        ...p,
        timetable: timetableId,
        start_time: formatTime(p.start_time),
        end_time: formatTime(p.end_time),
      }));
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
    }) => updateTimetable(payload.id, payload.name, payload.description, userToken?.token),
    onSuccess: () => {
      setIsLoading(false);
      Alert.alert("Success", "Timetable updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
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
      Alert.alert("Success", "Timetable created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || "Error creating periods");
      setIsLoading(false);
    },
  });

  const handleCreateTimetable = (formData: FormValues) => {
    if (!formData.name.trim()) {
      setErrorMessage("Please provide a name for the timetable.");
      return;
    }
    setIsLoading(true);
    if (isEditMode) {
      updateTimetableMutation.mutate({
        id: Number(id), // Assuming id is the timetable ID when editing
        name: formData.name,
        description: formData.description,
      });
    } else {
      createTimetableMutation.mutate({
        name: formData.name,
        description: formData.description,
        created_by: userInfo?.user?.id ?? 0,
        community: id!,
      });
    }
  };

  const handleAddOrUpdatePeriod = () => {
    const start_time = watch('start_time');
    const end_time = watch('end_time');

    console.log("New Period Times:", 
      start_time.toLocaleTimeString(), 
      end_time.toLocaleTimeString()
    );
    if (
      !newPeriod.course_name.trim() ||
      !newPeriod.lecturer.trim() ||
      !newPeriod.venue.trim()
    ) {
      setErrorMessage("Please fill all required fields for the period.");
      return;
    }
    if (
      !start_time ||
      !end_time ||
      start_time >= end_time
    ) {
      setErrorMessage("Please select valid start and end times for the period.");
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
    setErrorMessage(null);
    setNewPeriod({
      course_name: "",
      lecturer: "",
      venue: "",
      days: currentDay,
      start_time: new Date(),
      end_time: new Date(),
    });
  };

  const handleEditPeriod = (period: Period) => {
    setEditingPeriodId(period.id || null);
    setNewPeriod(period);
    setCurrentDay(period.days);
    setValue('start_time', period.start_time);
    setValue('end_time', period.end_time);
  
    // Force re-render for CustomDateTimeSelector if necessary
    // This is more of a workaround but can be helpful in some scenarios
    control._subjects.state.next({});
  };

  const deletePeriod = (id?: string) => {
    if (!id) return;
    Alert.alert(
      "Delete Period",
      "Are you sure you want to delete this period?",
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
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const filteredPeriods = periods.filter((p) => p.days === currentDay);


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
    subtitle: {
      fontSize: rMS(18),
      fontWeight: "bold",
      marginVertical: rV(10),
      color: themeColors.text,
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
    errorText: {
      color: "red",
      marginTop: rV(10),
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
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={{ paddingBottom: rV(20) }}
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
                error={errors.name?.message}
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
              const dayCompleted = periods.filter((p) => p.days === longDay).length > 0;
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
                      {dayCompleted && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  {index < daysOfWeek.length - 1 && <View style={styles.progressBarLine} />}
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.subtitle}>Periods for {reverseDayMapping[currentDay]}</Text>
        {filteredPeriods.length === 0 ? (
          <Text style={styles.noPeriodsText}>
            No periods added for {reverseDayMapping[currentDay]} yet.
          </Text>
        ) : (
          <FlatList
            data={filteredPeriods}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
              <View style={styles.periodItem}>
                <View style={styles.periodRow}>
                  <View style={styles.periodInfo}>
                    <Text style={styles.periodText}>
                      {item.course_name} ({formatTime(item.start_time)} - {formatTime(item.end_time)})
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
            )}
          />
        )}

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Add New Period</Text>
          <AnimatedRoundTextInput
            label="Course Name"
            value={newPeriod.course_name}
            onChangeText={(text) => setNewPeriod({ ...newPeriod, course_name: text })}
          />
          <AnimatedRoundTextInput
            label="Lecturer Name"
            value={newPeriod.lecturer}
            onChangeText={(text) => setNewPeriod({ ...newPeriod, lecturer: text })}
          />
          <AnimatedRoundTextInput
            label="Venue"
            value={newPeriod.venue}
            onChangeText={(text) => setNewPeriod({ ...newPeriod, venue: text })}
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
      value={formatTime(value)} // Convert Date to string "HH:mm"
      onTimeChange={(time) => {
        onChange(parseTime(time)); // Convert string back to Date
        if (!isEditMode) {
          setNewPeriod({ ...newPeriod, start_time: parseTime(time) }); // Only update if not in edit mode
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
      value={formatTime(value)} // Convert Date to string "HH:mm"
      onTimeChange={(time) => {
        onChange(parseTime(time)); // Convert string back to Date
        if (!isEditMode) {
          setNewPeriod({ ...newPeriod, end_time: parseTime(time) }); // Only update if not in edit mode
        }
      }}
      buttonTitle="Pick End Time"
    />
  )}
/>
        </View>

        <View style={{ marginTop: rV(20) }}>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <GameButton
              title={editingPeriodId ? "Update Period" : "Add Period"}
              onPress={handleAddOrUpdatePeriod}
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

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={themeColors.tint} />
          </View>
        )}
      </ScrollView>
    </>
  );
};


export default CreateTimetablePage;