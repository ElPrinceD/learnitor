// components/TimetableDisplay.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import Colors from "../constants/Colors";
import { router } from "expo-router";
// Recommended named import
import { Swipeable } from "react-native-gesture-handler";

interface Period {
  id: string;
  course_name: string;
  lecturer: string;
  days: string; // Comma-separated string
  venue: string;
  start_time: string;
  end_time: string;
  cancelled?: boolean;
}

interface TimetableDisplayProps {
  periods: Period[];
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ periods }) => {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Helper to format time as HH:MM only.
  const formatTime = (timeStr: string) => {
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  // Local state to manage period changes (delete, cancel)
  const [localPeriods, setLocalPeriods] = React.useState<Period[]>(
    periods.map((period) => ({
      ...period,
      cancelled: period.cancelled ?? false,
    }))
  );

  const handleDelete = (periodToDelete: Period) => {
    setLocalPeriods((prev) =>
      prev.filter((period) => period.id !== periodToDelete.id)
    );
  };

  const handleEdit = (period: Period) => {
    console.log("Periodic: ", period);
    router.push({
      pathname: "EditPeriods",
      params: {
        periodId: period.id,
        periodCourseName: period.course_name,
        periodLecturer: period.lecturer,
        periodStart: period.start_time,
        periodEnd: period.end_time,
        periodVenue: period.venue,
        periodDays: period.days,
      },
    });
  };

  // Toggle the cancelled state
  const handleToggleCancel = (periodToToggle: Period) => {
    setLocalPeriods((prev) =>
      prev.map((period) =>
        period.id === periodToToggle.id
          ? { ...period, cancelled: !period.cancelled }
          : period
      )
    );
  };

  // Confirm deletion before performing the delete action
  const confirmDelete = (period: Period) => {
    Alert.alert(
      "Delete Period",
      "Are you sure you want to delete this period?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => handleDelete(period) },
      ]
    );
  };

  // Confirm cancellation (or uncancellation) before toggling the state
  const confirmToggleCancel = (period: Period) => {
    if (period.cancelled) {
      Alert.alert(
        "Uncancel Period",
        "Are you sure you want to uncancel this period?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: () => handleToggleCancel(period) },
        ]
      );
    } else {
      Alert.alert(
        "Cancel Period",
        "Are you sure you want to cancel this period?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: () => handleToggleCancel(period) },
        ]
      );
    }
  };

  const styles = StyleSheet.create({
    tableHeader: {
      flexDirection: "row",
      backgroundColor: themeColors.tint,
      paddingVertical: 8,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    headerCell: {
      flex: 1,
      fontWeight: "bold",
      textAlign: "left",
      paddingHorizontal: 8,
    },
    row: {
      flexDirection: "row",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.textSecondary,
      backgroundColor: themeColors.background,
    },
    cell: {
      flex: 1,
      paddingHorizontal: 8,
      color: themeColors.text,
    },
    dayHeader: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      marginTop: 20,
      color: themeColors.text,
    },
    cancelledText: {
      textDecorationLine: "line-through",
      color: "gray",
    },
    actionContainer: {
      flexDirection: "row",
      alignItems: "center",
      // Adjust the width to accommodate three buttons (3 x 80)
      width: 240,
    },
    actionButton: {
      justifyContent: "center",
      alignItems: "center",
      width: 80,
      height: "100%",
    },
    actionText: {
      color: "white",
      fontWeight: "bold",
    },
  });

  // Render the swipeable action buttons for a period
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    period: Period
  ) => (
    <View style={styles.actionContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "red" }]}
        onPress={() => confirmDelete(period)}
      >
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "blue" }]}
        onPress={() => handleEdit(period)}
      >
        <Text style={styles.actionText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: period.cancelled ? "green" : "gray" },
        ]}
        onPress={() => confirmToggleCancel(period)}
      >
        <Text style={styles.actionText}>
          {period.cancelled ? "Uncancel" : "Cancel"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Wrap each period row in a Swipeable component
  const renderPeriod = ({ item }: { item: Period }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item)
      }
    >
      <View style={styles.row}>
        <Text style={[styles.cell, item.cancelled && styles.cancelledText]}>
          {formatTime(item.start_time)} - {formatTime(item.end_time)}
        </Text>
        <Text style={[styles.cell, item.cancelled && styles.cancelledText]}>
          {item.course_name}
        </Text>
        <Text style={[styles.cell, item.cancelled && styles.cancelledText]}>
          {item.lecturer}
        </Text>
        <Text style={[styles.cell, item.cancelled && styles.cancelledText]}>
          {item.venue}
        </Text>
      </View>
    </Swipeable>
  );

  return (
    <FlatList
      data={daysOfWeek}
      keyExtractor={(item) => item}
      renderItem={({ item: day }) => {
        // Filter the periods for the current day (assumes days are separated by ", ")
        const dayPeriods = localPeriods.filter((period) =>
          period.days.split(", ").includes(day)
        );
        if (dayPeriods.length === 0) return null;

        dayPeriods.sort((a, b) => {
          const [aHours, aMinutes] = a.start_time.split(":").map(Number);
          const [bHours, bMinutes] = b.start_time.split(":").map(Number);
          return aHours - bHours || aMinutes - bMinutes;
        });

        return (
          <View key={day}>
            <Text style={styles.dayHeader}>{day}</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Time</Text>
              <Text style={styles.headerCell}>Course Name</Text>
              <Text style={styles.headerCell}>Lecturer</Text>
              <Text style={styles.headerCell}>Venue</Text>
            </View>
            <FlatList
              data={dayPeriods}
              renderItem={renderPeriod}
              keyExtractor={(item, index) =>
                `${day}-${item.course_name}-${item.start_time}-${item.lecturer}-${index}`
              }
            />
          </View>
        );
      }}
    />
  );
};

export default TimetableDisplay;
