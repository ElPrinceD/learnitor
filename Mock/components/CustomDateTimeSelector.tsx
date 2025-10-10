import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Select } from "@tamagui/select";
import { Adapt } from "@tamagui/adapt";
import type { SelectProps } from "@tamagui/select";
import { Sheet } from "@tamagui/sheet";
import { useColorScheme } from "./useColorScheme";
import Colors from "../constants/Colors";
import { rMS, rS, rV, SIZES } from "../constants";
import DatePicker from "react-native-modern-datepicker";

interface CustomDateTimeSelectorProps extends SelectProps {
  onDateChange?: (date: string) => void;
  onTimeChange?: (time: string) => void;
  label: string;
  buttonTitle?: string;
  mode: "date" | "time";
  minDate?: string;
  maxDate?: string;
  initialValue?: string; // Added to support initial date or time
}

const CustomDateTimeSelector: React.FC<CustomDateTimeSelectorProps> = ({
  onDateChange,
  onTimeChange,
  label,
  buttonTitle = "Select Date or Time",
  mode,
  minDate,
  maxDate,
  initialValue,
  ...selectProps
}) => {
  // Initialize state with initialValue if provided, otherwise null
  const [selectedDate, setSelectedDate] = useState<string | null>(
    mode === "date" && initialValue ? initialValue : null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    mode === "time" && initialValue ? initialValue : null
  );
  const [isOpen, setIsOpen] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const formatDateTime = () => {
    if (mode === "date") {
      return selectedDate || buttonTitle;
    } else if (mode === "time") {
      return selectedTime || buttonTitle;
    }
    return buttonTitle;
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
    setIsOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (onTimeChange) {
      onTimeChange(time);
    }
    // Don't auto-dismiss - let user select both hour and minute
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      // Removed border - was only meant for ContinueWithEmail page
    },
    label: {
      fontSize: SIZES.large,
      color: themeColors.text,
      fontWeight: "bold",
      marginRight: rS(10),
    },
    selectContainer: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: rMS(20),
      borderTopRightRadius: rMS(20),
      paddingTop: rV(20),
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(20),
      paddingBottom: rV(15),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.text,
    },
    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    doneButton: {
      backgroundColor: themeColors.tint,
      paddingHorizontal: rS(15),
      paddingVertical: rV(8),
      borderRadius: rMS(6),
      marginRight: rS(10),
    },
    doneButtonText: {
      color: themeColors.background,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    modalTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    closeButton: {
      padding: rMS(5),
    },
    closeButtonText: {
      fontSize: SIZES.large,
      color: themeColors.text,
      fontWeight: "bold",
    },
    timePickerContainer: {
      padding: rS(20),
      maxHeight: 300,
    },
    timePickerScroll: {
      maxHeight: 250,
    },
    timePickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    hourPicker: {
      flex: 1,
      maxHeight: 200,
    },
    minutePicker: {
      flex: 1,
      maxHeight: 200,
    },
    timeOption: {
      paddingVertical: rV(10),
      paddingHorizontal: rS(15),
      marginVertical: rV(2),
      borderRadius: rMS(8),
      alignItems: "center",
    },
    selectedTimeOption: {
      backgroundColor: themeColors.tint,
    },
    timeOptionText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    selectedTimeOptionText: {
      color: themeColors.background,
      fontWeight: "bold",
    },
    timeSeparator: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
      marginHorizontal: rS(10),
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectContainer}>
        <Select
          value={
            (mode === "date" ? selectedDate : selectedTime) as
              | string
              | undefined
          }
          onValueChange={() => {}}
          open={isOpen}
          onOpenChange={setIsOpen}
          {...selectProps}
        >
          <Select.Trigger
            style={{
              backgroundColor: "transparent",
              borderColor: "transparent",
              borderWidth: 0,
              borderTopWidth: 0,
              borderBottomWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderRadius: rMS(6),
              paddingVertical: rV(12),
              paddingHorizontal: rS(16),
              zIndex: 10,
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <Select.Value
              style={{
                color: themeColors.text,
                fontWeight: "bold",
                fontSize: SIZES.medium,
              }}
            >
              {formatDateTime()}
            </Select.Value>
          </Select.Trigger>

          <Modal
            visible={isOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Select {mode === "date" ? "Date" : "Time"}
                  </Text>
                  <View style={styles.headerButtons}>
                    {mode === "time" && (
                      <TouchableOpacity
                        onPress={() => setIsOpen(false)}
                        style={styles.doneButton}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => setIsOpen(false)}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {mode === "date" ? (
                  <DatePicker
                    selected={selectedDate || initialValue || undefined}
                    onSelectedChange={handleDateChange}
                    options={{
                      backgroundColor: themeColors.background,
                      mainColor: themeColors.tint,
                      textHeaderColor: themeColors.text,
                      textDefaultColor: themeColors.text,
                      selectedTextColor: "#fff",
                    }}
                    minimumDate={minDate}
                    maximumDate={maxDate}
                    isGregorian={true}
                  />
                ) : (
                  <View style={styles.timePickerContainer}>
                    <ScrollView
                      style={styles.timePickerScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.timePickerRow}>
                        <ScrollView
                          style={styles.hourPicker}
                          showsVerticalScrollIndicator={false}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <TouchableOpacity
                              key={i}
                              style={[
                                styles.timeOption,
                                selectedTime?.startsWith(
                                  i.toString().padStart(2, "0")
                                ) && styles.selectedTimeOption,
                              ]}
                              onPress={() => {
                                const currentMinute =
                                  selectedTime?.split(":")[1] || "00";
                                const newTime = `${i
                                  .toString()
                                  .padStart(2, "0")}:${currentMinute}`;
                                handleTimeChange(newTime);
                              }}
                            >
                              <Text
                                style={[
                                  styles.timeOptionText,
                                  selectedTime?.startsWith(
                                    i.toString().padStart(2, "0")
                                  ) && styles.selectedTimeOptionText,
                                ]}
                              >
                                {i.toString().padStart(2, "0")}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <Text style={styles.timeSeparator}>:</Text>
                        <ScrollView
                          style={styles.minutePicker}
                          showsVerticalScrollIndicator={false}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <TouchableOpacity
                              key={i}
                              style={[
                                styles.timeOption,
                                selectedTime?.endsWith(
                                  i.toString().padStart(2, "0")
                                ) && styles.selectedTimeOption,
                              ]}
                              onPress={() => {
                                const currentHour =
                                  selectedTime?.split(":")[0] || "00";
                                const newTime = `${currentHour}:${i
                                  .toString()
                                  .padStart(2, "0")}`;
                                handleTimeChange(newTime);
                              }}
                            >
                              <Text
                                style={[
                                  styles.timeOptionText,
                                  selectedTime?.endsWith(
                                    i.toString().padStart(2, "0")
                                  ) && styles.selectedTimeOptionText,
                                ]}
                              >
                                {i.toString().padStart(2, "0")}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </Select>
      </View>
    </View>
  );
};

export default CustomDateTimeSelector;
