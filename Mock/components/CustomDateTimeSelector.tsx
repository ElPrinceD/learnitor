import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Sheet } from "@tamagui/sheet";
import Button from "./GameButton";
import { useColorScheme } from "./useColorScheme";
import Colors from "../constants/Colors";
import { rMS, rV, SIZES } from "../constants";
import DatePicker from "react-native-modern-datepicker";

interface CustomDateTimeSelectorProps {
  onDateChange?: (date: string) => void; // Callback for date change
  onTimeChange?: (time: string) => void; // Callback for time change
  label: string; // Label for the component
  buttonTitle?: string; // Default button title
  mode: "date" | "time"; // Mode to select date or time
  minDate?: string; // Minimum selectable date (ISO format)
  maxDate?: string; // Maximum selectable date (ISO format)
}

const CustomDateTimeSelector: React.FC<CustomDateTimeSelectorProps> = ({
  onDateChange,
  onTimeChange,
  label,
  buttonTitle = "Select Date or Time",
  mode,
  minDate,
  maxDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

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
    setShowPicker(false); // Close picker after selection
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (onTimeChange) {
      onTimeChange(time);
    }
    setShowPicker(false); // Close picker after selection
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: rV(10),
    },
    label: {
      fontSize: SIZES.large,
      marginBottom: rV(8),
      color: themeColors.text,
      fontWeight: "bold",
    },
    button: {
      backgroundColor: colorScheme === "light" ? "#EEEEEE" : "#3A3B3C",
      padding: rMS(15),
      alignItems: "flex-start",
      borderRadius: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Button
        title={formatDateTime()} // Display selected date or time or fallback title
        onPress={() => setShowPicker(true)} // Open the bottom sheet
        style={styles.button}
      />

      <Sheet
        modal
        open={showPicker}
        onOpenChange={setShowPicker} // Control the sheet visibility
        dismissOnSnapToBottom
        snapPoints={[45]} // Adjust the sheet size
        animationConfig={{
          type: "spring",
          damping: 22,
          mass: 1,
          stiffness: 200,
        }}
      >
        <Sheet.Frame
          style={{
            backgroundColor: themeColors.background,
            padding: 10,
          }}
        >
          <Sheet.ScrollView>
            {mode === "date" ? (
              <DatePicker
                selected={selectedDate || undefined}
                onSelectedChange={handleDateChange}
                options={{
                  backgroundColor: themeColors.background,
                  mainColor: themeColors.tint,
                }}
                minimumDate={minDate} // Disable past dates if provided
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
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
      </Sheet>
    </View>
  );
};

export default CustomDateTimeSelector;
