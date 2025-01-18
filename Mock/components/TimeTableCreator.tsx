import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Controller } from "react-hook-form";
import Colors from "../constants/Colors";
import { rMS, rS, rV } from "../constants";
import AnimatedTextInput from "../components/AnimatedTextInput";
import GameButton from "../components/GameButton";
import TimetableDisplay from "../components/TimetableDisplay";
import CustomDateTimeSelector from "../components/CustomDateTimeSelector";
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
  id?: number;
}

interface TimetableCreatorProps {
  control: any;
  handleSubmit: any;
  watch: any;
  reset: any;
  setValue: any;
  errors: any;
  step: number;
  selectedDays: string[];
  setSelectedDays: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTimes: { [key: string]: string };
  setSelectedTimes: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  endTimes: { [key: string]: string };
  setEndTimes: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  timetable: Timetable;
  setTimetable: React.Dispatch<React.SetStateAction<Timetable>>;
  periods: Period[];
  setPeriods: React.Dispatch<React.SetStateAction<Period[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  addPeriod: (data: any) => void;
  handleSave: () => void;
  nextStep: () => void;
  previousStep: () => void;
  modalVisible: boolean;
}

const TimetableCreator: React.FC<TimetableCreatorProps> = ({
  control,
  handleSubmit,
  watch,
  reset,
  setValue,
  errors,
  step,
  selectedDays,
  setSelectedDays,
  selectedTimes,
  setSelectedTimes,
  endTimes,
  setEndTimes,
  timetable,
  periods,
  isLoading,
  addPeriod,
  handleSave,
  nextStep,
  previousStep,
  modalVisible,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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

  const closeModalAndNavigateBack = () => {
    router.back();
  };

  const renderContent = () => {
    if (step === 1) {
      return (
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
      );
    } else if (step === 2) {
      return (
        <>
          <View style={{ paddingTop: rV(15) }}>
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
          </View>
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
      );
    } else if (step === 3) {
      return (
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
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: "timetableCreator" }]}
        keyExtractor={(item) => item.key}
        renderItem={() => renderContent()}
        ListEmptyComponent={null}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
};

export default TimetableCreator;
