// components/TimetableDisplay.tsx

import React from "react";
import { View, Text, StyleSheet, FlatList, useColorScheme } from "react-native";
import Colors from "../constants/Colors";

interface Course {
  subject: string;
  teacher: string;
  days: string[];
  time: string;
  duration: string;
  endTime: string;
}

const TimetableDisplay: React.FC<{ courses: Course[] }> = ({ courses }) => {
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

  const renderCourse = ({ item }: { item: Course }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>
        {item.time} - {item.endTime}
      </Text>
      <Text style={styles.cell}>{item.subject}</Text>
      <Text style={styles.cell}>{item.teacher}</Text>
    </View>
  );

  return (
    <FlatList
      data={daysOfWeek}
      keyExtractor={(item) => item}
      renderItem={({ item: day }) => {
        const dayCourses = courses.filter((course) =>
          course.days.includes(day)
        );
        if (dayCourses.length === 0) return null;

        dayCourses.sort((a, b) => {
          const [aHours, aMinutes] = a.time.split(":").map(Number);
          const [bHours, bMinutes] = b.time.split(":").map(Number);
          return aHours - bHours || aMinutes - bMinutes;
        });

        return (
          <View key={day}>
            <Text style={[styles.dayHeader, { color: themeColors.text }]}>
              {day}
            </Text>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Time</Text>
              <Text style={styles.headerCell}>Subject</Text>
              <Text style={styles.headerCell}>Teacher</Text>
            </View>
            <FlatList
              data={dayCourses}
              renderItem={renderCourse}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
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
    borderBottomColor: "#e9ecef",
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default TimetableDisplay;
