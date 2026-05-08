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
import { Sheet } from "@tamagui/sheet";
import type { SelectProps } from "@tamagui/select";
import { useColorScheme } from "./useColorScheme";
import Colors from "../constants/Colors";
import { rMS, rS, rV, SIZES } from "../constants";
import { Calendar } from "react-native-calendars";
import { ChevronDown, X } from "lucide-react-native";

interface DateSelectorProps extends SelectProps {
  onDateChange: (date: string) => void;
  label: string;
  buttonTitle?: string;
  minDate?: boolean;
  // Optional prop: If provided, this date will be used as the initial date
  initialDate?: string;
  // Optional prop: If true, starts with no date selected (blank state)
  startBlank?: boolean;
}

// Helper function to get today's date in ISO format.
const getTodayDate = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
};

// Month names array
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Generate years array (from 1950 to current year + 10)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = 1950; year <= currentYear + 10; year++) {
    years.push(year);
  }
  return years;
};

const DateSelector: React.FC<DateSelectorProps> = ({
  onDateChange,
  label,
  buttonTitle = "Select a date",
  minDate = false,
  initialDate,
  startBlank = false,
  ...selectProps
}) => {
  // If startBlank is true, start with no date. Otherwise, use initialDate or today's date.
  const defaultDateStr = startBlank
    ? ""
    : initialDate && initialDate.trim() !== ""
    ? initialDate
    : getTodayDate();
  const defaultDate = startBlank ? null : new Date(defaultDateStr);

  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultDate);
  const [selected, setSelected] = useState(defaultDateStr);
  const [currentMonth, setCurrentMonth] = useState(
    startBlank ? new Date().getMonth() + 1 : defaultDate.getMonth() + 1
  );
  const [currentYear, setCurrentYear] = useState(
    startBlank ? new Date().getFullYear() : defaultDate.getFullYear()
  );
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Format date for display in the trigger.
  const formatDate = (date: Date | null) => {
    if (!date) return buttonTitle;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (day: any) => {
    if (!day?.dateString) return;
    const date = new Date(day.dateString);
    setSelectedDate(date);
    setSelected(day.dateString);
    onDateChange(day.dateString);
    setIsOpen(false);
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
    setShowYearPicker(false);
  };

  const handleMonthChange = (month: number) => {
    setCurrentMonth(month);
    setShowMonthPicker(false);
  };

  const getCurrentDateString = () => {
    return `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: {
      fontSize: rMS(13),
      color: themeColors.text,
      fontWeight: "700",
      marginRight: rS(10),
    },
    selectContainer: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: rMS(24),
      borderTopRightRadius: rMS(24),
      paddingTop: rV(8),
      maxHeight: "80%",
    },
    modalHandle: {
      width: rS(36),
      height: 4,
      borderRadius: 2,
      backgroundColor: themeColors.border + "60",
      alignSelf: "center",
      marginBottom: rV(12),
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(20),
      paddingBottom: rV(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border + "30",
    },
    modalTitle: {
      fontSize: rMS(15),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    closeButton: {
      width: rMS(28),
      height: rMS(28),
      borderRadius: rMS(14),
      backgroundColor: themeColors.border + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    pickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(20),
      paddingVertical: rV(10),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border + "20",
    },
    pickerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(4),
      paddingHorizontal: rS(14),
      paddingVertical: rV(8),
      borderRadius: rMS(12),
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "30",
    },
    pickerButtonText: {
      fontSize: rMS(13),
      color: themeColors.text,
      fontWeight: "600",
    },
    pickerContainer: {
      maxHeight: rV(200),
      paddingHorizontal: rS(20),
      paddingVertical: rV(10),
    },
    pickerItem: {
      paddingVertical: rV(12),
      paddingHorizontal: rS(15),
      borderRadius: rMS(12),
      marginVertical: rV(2),
    },
    pickerItemSelected: {
      backgroundColor: themeColors.tint,
    },
    pickerItemText: {
      fontSize: rMS(13),
      color: themeColors.text,
      textAlign: "center",
      fontWeight: "500",
    },
    pickerItemTextSelected: {
      color: "#fff",
      fontWeight: "700",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectContainer}>
        <Select
          value={selected}
          onValueChange={() => {}}
          open={isOpen}
          onOpenChange={setIsOpen}
          disablePreventBodyScroll
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
              {selectedDate ? formatDate(selectedDate) : buttonTitle}
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
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.closeButton}
                  >
                    <X size={14} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Year and Month Picker Header */}
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowYearPicker(!showYearPicker)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {currentYear}
                    </Text>
                    <ChevronDown
                      size={14}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowMonthPicker(!showMonthPicker)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {monthNames[currentMonth - 1]}
                    </Text>
                    <ChevronDown
                      size={14}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Year Picker */}
                {showYearPicker && (
                  <View style={styles.pickerContainer}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {generateYears().map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.pickerItem,
                            currentYear === year && styles.pickerItemSelected,
                          ]}
                          onPress={() => handleYearChange(year)}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              currentYear === year &&
                                styles.pickerItemTextSelected,
                            ]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Month Picker */}
                {showMonthPicker && (
                  <View style={styles.pickerContainer}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {monthNames.map((month, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.pickerItem,
                            currentMonth === index + 1 &&
                              styles.pickerItemSelected,
                          ]}
                          onPress={() => handleMonthChange(index + 1)}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              currentMonth === index + 1 &&
                                styles.pickerItemTextSelected,
                            ]}
                          >
                            {month}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Calendar */}
                {!showYearPicker && !showMonthPicker && (
                  <Calendar
                    onDayPress={(day) => {
                      handleDateChange(day);
                    }}
                    enableSwipeMonths={true}
                    current={getCurrentDateString()}
                    markedDates={{
                      [selected]: {
                        selected: true,
                        selectedColor: themeColors.tint,
                        selectedTextColor: themeColors.background,
                      },
                    }}
                    minDate={minDate ? getTodayDate() : undefined}
                    theme={{
                      backgroundColor: themeColors.background,
                      calendarBackground: themeColors.background,
                      textSectionTitleColor: themeColors.text,
                      selectedDayTextColor: themeColors.background,
                      todayTextColor: themeColors.tint,
                      dayTextColor: themeColors.text,
                      textDisabledColor: themeColors.textSecondary,
                      monthTextColor: themeColors.text,
                      arrowColor: themeColors.text,
                      textMonthFontWeight: "bold",
                      textMonthFontSize: SIZES.large,
                      textDayHeaderFontWeight: "bold",
                    }}
                  />
                )}
              </View>
            </View>
          </Modal>
        </Select>
      </View>
    </View>
  );
};

export default DateSelector;
