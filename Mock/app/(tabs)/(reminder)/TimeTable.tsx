import React, { useState } from "react";
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
import { createPeriod, createTimetable } from "../../../TimelineApiCalls";
import { useAuth } from "../../../components/AuthContext";
import { router } from "expo-router";
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
  start_time: string;
  end_time: string;
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
  const { id } = route.params as RouteParams;
  const { userToken, userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
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
    start_time: "",
    end_time: "",
  });
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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
      const finalPeriods = periods.map((p) => ({ ...p, timetable: timetableId }));
      createPeriodMutation.mutate(finalPeriods);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || "Error creating timetable");
      setIsLoading(false);
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: async (payload: Period[]) =>
      createPeriod(payload, userToken?.token ?? ""),
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
    createTimetableMutation.mutate({
      name: formData.name,
      description: formData.description,
      created_by: userInfo?.user?.id ?? 0,
      community: id,
    });
  };

  const handleAddOrUpdatePeriod = () => {
    if (
      !newPeriod.course_name.trim() ||
      !newPeriod.lecturer.trim() ||
      !newPeriod.venue.trim()
    ) {
      setErrorMessage("Please fill all required fields for the period.");
      return;
    }
    if (!newPeriod.start_time || !newPeriod.end_time) {
      setErrorMessage("Please select start and end times for the period.");
      return;
    }

    if (editingPeriodId) {
      setPeriods((prev) =>
        prev.map((period) =>
          period.id === editingPeriodId ? { ...newPeriod, id: editingPeriodId } : period
        )
      );
      setEditingPeriodId(null);
    } else {
      const newPeriodWithId = { ...newPeriod, id: Date.now().toString() };
      setPeriods((prev) => [...prev, newPeriodWithId]);
    }
    setErrorMessage(null);
    setNewPeriod({
      course_name: "",
      lecturer: "",
      venue: "",
      days: currentDay,
      start_time: "",
      end_time: "",
    });
  };

  const handleEditPeriod = (period: Period) => {
    setEditingPeriodId(period.id || null);
    setNewPeriod(period);
    setCurrentDay(period.days);
  };

  const deletePeriod = (id?: string) => {
    if (!id) return;
    Alert.alert("Delete Period", "Are you sure you want to delete this period?", [
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
              start_time: "",
              end_time: "",
            });
          }
        },
        style: "destructive",
      },
    ]);
  };

  const filteredPeriods = periods.filter((p) => p.days === currentDay);

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

        <View style={{ alignItems: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.progressBarContainer, { justifyContent: "center" }]}
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
                      {item.course_name} ({item.start_time} - {item.end_time})
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
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.timeText}>
              {newPeriod.start_time ? `Start: ${newPeriod.start_time}` : "Start Time"}
            </Text>
            <Text style={styles.arrow}>></Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.timeText}>
              {newPeriod.end_time ? `End: ${newPeriod.end_time}` : "End Time"}
            </Text>
            <Text style={styles.arrow}>></Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: rV(20) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <GameButton
              title={editingPeriodId ? "Update Period" : "Add Period"}
              onPress={handleAddOrUpdatePeriod}
            />
          </View>
          <View style={{ width: '100%', marginTop: rV(20) }}>
            <GameButton
              title={isLoading ? "Saving..." : "Save Timetable"}
              onPress={handleSubmit(handleCreateTimetable)}
              disabled={isLoading}
              style={{ width: '100%' }}
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

      {showStartPicker && (
        <CustomDateTimeSelector
          mode="time"
          onTimeChange={(time) => {
            setNewPeriod({ ...newPeriod, start_time: time });
            setShowStartPicker(false);
          }}
          onCancel={() => setShowStartPicker(false)}
        />
      )}
      {showEndPicker && (
        <CustomDateTimeSelector
          mode="time"
          onTimeChange={(time) => {
            setNewPeriod({ ...newPeriod, end_time: time });
            setShowEndPicker(false);
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: rV(15),
  },
  sectionContainer: {
    backgroundColor: "#f5f5f5",
    padding: rV(15),
    borderRadius: rMS(8),
    marginBottom: rV(15),
  },
  sectionHeader: {
    fontSize: rMS(16),
    fontWeight: "bold",
    marginBottom: rV(10),
    color: "#333",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rV(10),
    marginBottom: rV(15),
  },
  dayProgressChip: {
    borderWidth: rS(1),
    borderColor: "#ccc",
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
    color: "#333",
  },
  checkMark: {
    marginLeft: rS(5),
    color: "green",
    fontSize: rMS(14),
  },
  progressBarLine: {
    height: 2,
    flex: 1,
    backgroundColor: "#ccc",
    marginHorizontal: rS(1),
  },
  subtitle: {
    fontSize: rMS(18),
    fontWeight: "bold",
    marginVertical: rV(10),
  },
  noPeriodsText: {
    fontSize: rMS(14),
    color: "#999",
    marginVertical: rV(10),
  },
  periodItem: {
    backgroundColor: "#f0f0f0",
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
  },
  periodText: {
    fontSize: rMS(14),
    fontWeight: "600",
  },
  periodLecturer: {
    fontSize: rMS(12),
    color: "#666",
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
    borderBottomColor: "#ccc",
  },
  timeText: {
    fontSize: rMS(16),
    color: "#333",
  },
  arrow: {
    fontSize: rMS(20),
    color: "#333",
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

export default CreateTimetablePage;