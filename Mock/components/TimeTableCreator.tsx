import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import Colors from "../constants/Colors";
import { rMS, rS, rV } from "../constants";
import AnimatedTextInput from "../components/AnimatedTextInput";
import GameButton from "../components/GameButton";
import TimetableDisplay from "../components/TimetableDisplay";
import { useAuth } from "../components/AuthContext";
import CustomDateTimeSelector from "../components/CustomDateTimeSelector";
import { useMutation } from "@tanstack/react-query";
import { createPeriod, createTask, createTimetable } from "../TimelineApiCalls";
import { router } from "expo-router";

interface Period {
  course_name: string;
  lecturer: string;
  days: string;
  venue: string;
  start_time: string;
  end_time: string;
  timetable?: number;
}
interface Timetable {
  name: string;
  description: string;
  id?: number; // Add id property to the interface
}

const TimetableCreator: React.FC = () => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      periods: [
        {
          course_name: "",
          lecturer: "",
          days: "",
          venue: "",
          start_time: "",
          end_time: "",
        },
      ],
    },
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string }>(
    {}
  );
  const [endTimes, setEndTimes] = useState<{ [key: string]: string }>({});
  const [timetable, setTimetable] = useState<Timetable>({
    name: "",
    description: "",
  });
  const [periods, setPeriods] = useState<Period[]>([]);
  const [step, setStep] = useState(1); // Step tracker for multi-step form
  const [modalVisible, setModalVisible] = useState(true); // Start with modal open
  const { userToken, userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const createTimetableMutation = useMutation<
    any,
    any,
    {
      timetableData: Omit<Timetable, "id"> & { created_by: number | undefined };
      token: string;
    }
  >({
    mutationFn: async ({ timetableData, token }) => {
      return await createTimetable(timetableData, token);
    },
    onSuccess: (data) => {
      setTimetable((prev) => ({ ...prev, id: data.id })); // Assuming the response includes an id
    },
    onError: (error) => {
      alert(error.message || "Error creating timetable");
    },
  });

  const createPeriodMutation = useMutation<
    any,
    any,
    { periodData: Period; token: string }
  >({
    mutationFn: async ({ periodData, token }) => {
      return await createPeriod({ ...periodData }, token);
    },
    onError: (error) => {
      alert(error.message || "Error creating period");
    },
  });

  const addPeriod = (data: any) => {
    const newPeriod: Period = {
      course_name: data["periods"][0].course_name,
      lecturer: data["periods"][0].lecturer,
      days: selectedDays.join(", "),
      venue: data["periods"][0].venue,
      start_time: selectedTimes[selectedDays[0]] || "",
      end_time: endTimes[selectedDays[0]] || "",
      timetable: timetable.id,
    };
    setPeriods((prev) => [...prev, newPeriod]);

    // Reset form fields for adding another period if needed
    reset({
      name: watch("name"),
      description: watch("description"),
      periods: [
        {
          course_name: "",
          lecturer: "",
          venue: "",
          days: "",
          start_time: "",
          end_time: "",
        },
      ],
    });
    setSelectedDays([]);
    setSelectedTimes({});
    setEndTimes({});
  };

  const handleSave = () => {
    const { name, description } = watch();
    if (!name.trim()) {
      alert("Please provide a name for the timetable.");
      return;
    }
    // Show loading
    setIsLoading(true);

    createTimetableMutation.mutate(
      {
        timetableData: {
          name,
          description,
          created_by: userInfo?.user.id,
        },
        token: userToken?.token!,
      },
      {
        onSuccess: () => {
          console.log(timetable.id);
          Promise.all(
            periods.map((period) =>
              createPeriodMutation.mutateAsync({
                periodData: {
                  ...period,
                  timetable: timetable.id!, // Assuming timetable.id is not null or undefined here
                },
                token: userToken?.token!,
              })
            )
          )
            .then(() => {
              setIsLoading(false); // Hide loading
              router.navigate("three");
            })
            .catch((error) => {
              setIsLoading(false); // Hide loading on failure
              alert(error.message || "Error creating periods");
            });
        },
        onError: (error) => {
          setIsLoading(false); // Hide loading if timetable creation fails
          alert(error.message || "Error creating timetable");
        },
      }
    );
  };
  const nextStep = () => {
    if (step === 1 && !errors.name) {
      setTimetable({
        name: watch("name"),
        description: watch("description"),
      });
      setStep(step + 1);
      setModalVisible(false); // Close the modal when moving to next step
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const closeModalAndNavigateBack = () => {
    router.back();
  };

  const renderDayButton = (item: string) => (
    <TouchableOpacity
      style={[
        styles.dayButton,
        selectedDays.includes(item) ? styles.selectedDayButton : null,
      ]}
      onPressIn={() =>
        setSelectedDays((prev) =>
          prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
        )
      }
    >
      <Text style={{ color: themeColors.text }}>{item.substring(0, 3)}</Text>
    </TouchableOpacity>
  );
  useEffect(() => {
    console.log("Timetable periods:", periods);
    console.log("Timetable details 2:", timetable);
  }, [periods, timetable]);
  useEffect(() => {
    const currentTimetable = watch(["name", "description"]);
    console.log("Timetable details:", currentTimetable);
  }, [watch("name"), watch("description")]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      padding: rV(15),
    },
    dayButtonContainer: {
      marginVertical: 10,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.tint,
      backgroundColor: "transparent",
      marginHorizontal: 5,
      marginBottom: 5,
    },
    selectedDayButton: {
      borderColor: themeColors.selectedItem,
      borderWidth: 3,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    buttons: {
      width: rS(150),
      paddingVertical: rV(10),
      borderRadius: 10,
      backgroundColor: themeColors.tint,
      alignItems: "center",
    },
    preview: {
      marginTop: 20,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      backgroundColor: themeColors.background,
      padding: 20,
      borderRadius: 10,
      width: "80%",
    },
  });

  return (
    <>
      <ScrollView style={styles.container}>
        {step === 1 && (
          <>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={closeModalAndNavigateBack}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Controller
                    control={control}
                    name="name"
                    rules={{ required: "Name is required" }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AnimatedTextInput
                        label="Timetable Name"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AnimatedTextInput
                        label="Description"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  <GameButton onPress={nextStep} title="Next" />
                  <GameButton
                    onPress={closeModalAndNavigateBack}
                    title="Cancel"
                    style={{ marginTop: rV(10) }}
                  />
                </View>
              </View>
            </Modal>
          </>
        )}

        {step === 2 && (
          <>
            <Controller
              control={control}
              name="periods.0.course_name"
              render={({ field: { onChange, value } }) => (
                <AnimatedTextInput
                  label="Course Name"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="periods.0.lecturer"
              render={({ field: { onChange, value } }) => (
                <AnimatedTextInput
                  label="Lecturer"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="periods.0.venue"
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
                  label="Venue"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <View style={styles.dayButtonContainer}>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map(renderDayButton)}
            </View>
            {selectedDays.map((day) => (
              <View key={day}>
                <CustomDateTimeSelector
                  mode="time"
                  label={`Select start time for ${day}`}
                  onTimeChange={(time) =>
                    setSelectedTimes((prev) => ({ ...prev, [day]: time }))
                  }
                  buttonTitle="Pick Start Time"
                />
                <CustomDateTimeSelector
                  mode="time"
                  label={`Select end time for ${day}`}
                  onTimeChange={(endTime) =>
                    setEndTimes((prev) => ({ ...prev, [day]: endTime }))
                  }
                  buttonTitle="Pick End Time"
                />
              </View>
            ))}
            <View style={styles.buttonContainer}>
              <GameButton
                onPress={handleSubmit(addPeriod)}
                style={styles.buttons}
                title="Add Course"
              />
              <GameButton
                onPress={nextStep}
                style={styles.buttons}
                title="Preview"
              />
            </View>
          </>
        )}

        {step === 3 && (
          <View>
            <Text
              style={{
                color: themeColors.text,
                fontSize: 16,
                fontWeight: "bold",
                alignSelf: "center",
                marginBottom: 10,
              }}
            >
              Timetable Preview
            </Text>
            <TimetableDisplay periods={periods || []} />
            <View style={styles.buttonContainer}>
              <GameButton
                onPress={previousStep}
                style={styles.buttons}
                title="Back"
                disabled={isLoading}
              />
              <GameButton
                onPress={handleSave}
                style={styles.buttons}
                title="Save Timetable"
                disabled={isLoading}
              >
                {isLoading && (
                  <ActivityIndicator size="small" color={themeColors.text} />
                )}
              </GameButton>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default TimetableCreator;
