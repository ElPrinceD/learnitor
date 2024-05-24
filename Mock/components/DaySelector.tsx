// DaySelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  days: string[];
  selectedDay: string;
  setSelectedDay: (day: string) => void;
}

const DaySelector: React.FC<Props> = ({
  days,
  selectedDay,
  setSelectedDay,
}) => {
  return (
    <View style={styles.touchableContainer}>
      {days.map((day, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.touchableButton,
            selectedDay === day && {
              backgroundColor: "orange",
              padding: 10,
              borderRadius: 17,
            },
          ]}
          onPress={() => setSelectedDay(day)}
        >
          <Text style={styles.touchableText}>{day}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    marginTop: -70,
    flexDirection: "row",
    backgroundColor: "#f4f7f3",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 10,
    borderRadius: 30,
    width: "100%",
  },
  touchableButton: {
    borderRadius: 10,
  },
  touchableText: {
    color: "#145714",
    fontSize: 24,
    fontWeight: "bold",
    padding: 5,
  },
});

export default DaySelector;
