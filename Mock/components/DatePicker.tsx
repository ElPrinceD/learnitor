import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DatePickerProps {
  date: Date;
  show: boolean;
  onDateChange: (event: any, selectedDate: Date | undefined) => void;
  setShow: (show: boolean) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  show,
  onDateChange,
  setShow,
}) => {
  return (
    <View>
      <TouchableOpacity onPress={() => setShow(true)}>
        <Text>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShow(false);
            onDateChange(event, selectedDate);
          }}
        />
      )}
    </View>
  );
};

export default DatePicker;
