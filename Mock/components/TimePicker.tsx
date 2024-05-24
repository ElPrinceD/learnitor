import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface TimePickerProps {
  time: Date;
  show: boolean;
  onTimeChange: (event: any, selectedTime: Date | undefined) => void;
  setShow: (show: boolean) => void;
}

const formatTime = (time: Date) => {
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const TimePicker: React.FC<TimePickerProps> = ({
  time,
  show,
  onTimeChange,
  setShow,
}) => {
  return (
    <View>
      <TouchableOpacity onPress={() => setShow(true)}>
        <Text>{formatTime(time)}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={time}
          mode="time"
          display="clock"
          onChange={(event, selectedTime) => {
            setShow(false);
            onTimeChange(event, selectedTime);
          }}
        />
      )}
    </View>
  );
};

export default TimePicker;
