import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
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
}

const CustomDateTimeSelector: React.FC<CustomDateTimeSelectorProps> = ({
  onDateChange,
  onTimeChange,
  label,
  buttonTitle = "Select Date or Time",
  mode,
  minDate,
  maxDate,
  ...selectProps
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
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
    setIsOpen(false);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row", // Change to row
      alignItems: "center",
      // paddingVertical: rV(10),
      justifyContent: "space-between",
      borderBottomWidth: rMS(1),
      borderBottomColor: themeColors.textSecondary,
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
                  {mode === "date" ? (
                    <DatePicker
                      selected={selectedDate || undefined}
                      onSelectedChange={handleDateChange}
                      options={{
                        backgroundColor: themeColors.background,
                        mainColor: themeColors.tint,
                      }}
                      minimumDate={minDate}
                      maximumDate={maxDate}
                    />
                  ) : (
                    <DatePicker
                      mode="time"
                      selected={selectedTime || undefined}
                      onTimeChange={handleTimeChange}
                      options={{
                        backgroundColor: themeColors.background,
                        mainColor: themeColors.tint,
                      }}
                    />
                  )}
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

export default CustomDateTimeSelector;
