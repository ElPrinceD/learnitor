import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Select } from "@tamagui/select";
import { Adapt } from "@tamagui/adapt";
import { Sheet } from "@tamagui/sheet";
import type { SelectProps } from "@tamagui/select";
import { useColorScheme } from "./useColorScheme";
import Colors from "../constants/Colors";
import { rMS, rS, rV, SIZES } from "../constants";
import { Calendar } from "react-native-calendars";

interface DateSelectorProps extends SelectProps {
  onDateChange: (date: string) => void;
  label: string;
  buttonTitle?: string;
  minDate?: boolean;
  // Optional prop: If provided, this date will be used as the initial date
  initialDate?: string;
}

// Helper function to get today's date in ISO format.
const getTodayDate = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
};

const DateSelector: React.FC<DateSelectorProps> = ({
  onDateChange,
  label,
  buttonTitle = "Select a date",
  minDate = false,
  initialDate,
  ...selectProps
}) => {
  // If an initialDate is provided, use it. Otherwise, fall back to today's date.
  const defaultDateStr =
    initialDate && initialDate.trim() !== "" ? initialDate : getTodayDate();
  const defaultDate = new Date(defaultDateStr);

  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultDate);
  const [selected, setSelected] = useState(defaultDateStr);

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
    if (!day?.timestamp) return;
    const date = new Date(day.timestamp);
    setSelectedDate(date);
    setSelected(day.dateString);
    onDateChange(day.dateString);
    setIsOpen(false);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      // No border here.
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
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectContainer}>
        <Select
          // Remove any default Select border by providing an empty style object.
          style={{ borderWidth: 0, backgroundColor: "transparent" }}
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
              {formatDate(selectedDate)}
            </Select.Value>
          </Select.Trigger>

          <Adapt when={true} platform="touch">
            <Sheet
              modal
              open={isOpen}
              onOpenChange={setIsOpen}
              animationConfig={{
                type: "spring",
                damping: 22,
                mass: 1.2,
                stiffness: 220,
              }}
              snapPoints={[40]}
            >
              <Sheet.Frame style={{ backgroundColor: themeColors.background }}>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                  <Calendar
                    onDayPress={handleDateChange}
                    enableSwipeMonths={true}
                    markedDates={{
                      [selected]: {
                        selected: true,
                        selectedColor: themeColors.background,
                      },
                    }}
                    minDate={minDate ? getTodayDate() : undefined}
                    theme={{
                      backgroundColor: themeColors.tint,
                      calendarBackground: themeColors.background,
                      textSectionTitleColor: themeColors.text,
                      selectedDayTextColor: "#1434A4",
                      todayTextColor: "#FF6347",
                      dayTextColor: themeColors.text,
                      textDisabledColor: themeColors.textSecondary,
                      monthTextColor: themeColors.text,
                      arrowColor: themeColors.text,
                      textMonthFontWeight: "bold",
                      textMonthFontSize: SIZES.large,
                      textDayHeaderFontWeight: "bold",
                    }}
                  />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay
                animation="lazy"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
              />
            </Sheet>
          </Adapt>
        </Select>
      </View>
    </View>
  );
};

export default DateSelector;
