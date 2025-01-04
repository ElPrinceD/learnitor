import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import { Sheet } from "@tamagui/sheet";
import Button from "./GameButton";
import { useColorScheme } from "./useColorScheme";
import Colors from "../constants/Colors";
import { rMS, rV, SIZES } from "../constants";

interface DateSelectorProps {
  onDateChange: (date: string) => void; // Callback to pass selected date
  label: string; // Label for the component
  buttonTitle?: string; // Custom title for the button (optional)
  minDate?: boolean; // If true, disables past dates
}

const DateSelector: React.FC<DateSelectorProps> = ({
  onDateChange,
  label,
  buttonTitle = "Select a date", // Default button title
  minDate = false, // Default to false (no restrictions)
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selected, setSelected] = useState("");

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const formatDate = (date: Date | null) => {
    if (!date) return buttonTitle; // Return the button title if date is null
    try {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.warn("Error formatting date:", error);
      return buttonTitle;
    }
  };

  const handleDateChange = (day: any) => {
    if (!day?.timestamp) {
      console.warn("Invalid date object:", day);
      return;
    }
    const date = new Date(day.timestamp);
    setSelectedDate(date);
    setSelected(day.dateString);
    onDateChange(day.dateString); // Pass selected date to parent
    setShowCalendar(false); // Close bottom sheet
  };

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
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
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Button
        title={formatDate(selectedDate)} // Display formatted date or fallback title
        onPress={() => setShowCalendar(true)} // Open the bottom sheet
        style={{
          backgroundColor: colorScheme === "light" ? "#EEEEEE" : "#3A3B3C",
          padding: rMS(15),
          alignItems: "flex-start",
          borderRadius: 8,
        }}
      />

      <Sheet
        modal
        open={showCalendar}
        onOpenChange={setShowCalendar} // Control the sheet visibility
        dismissOnSnapToBottom
        snapPoints={[40]} // Adjust the size of the sheet
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
            <Calendar
              onDayPress={handleDateChange}
              enableSwipeMonths={true}
              markedDates={{
                [selected]: {
                  selected: true,
                  selectedColor: themeColors.background,
                },
              }}
              minDate={minDate ? getTodayDate() : undefined} // Disable past dates if minDate is true
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
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
      </Sheet>
    </View>
  );
};

export default DateSelector;
