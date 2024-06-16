import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  SafeAreaView,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CourseForm from "./CourseForm";
import TimetableDisplay from "../../../components/TimetableDisplay";
import Colors from "../../../constants/Colors";
import { BottomSheetModal, useBottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

interface Course {
  subject: string;
  teacher: string;
  days: string[];
  time: string;
  duration: string;
  endTime: string;
}

interface Timetable {
  name: string;
  courses: Course[];
}

const TimetableScreen: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentTimetable, setCurrentTimetable] = useState<Timetable | null>(
    null
  );
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const addTimetable = (newTimetable: Timetable) => {
    setTimetables((prevTimetables) => [...prevTimetables, newTimetable]);
    setFormVisible(false);
  };

  const previewTimetable = (timetable: Timetable) => {
    setCurrentTimetable(timetable);
    setPreviewVisible(true);
  };

  const BottomSheetRef = useRef<BottomSheetModal>(null);
  const handlePresentModal = () => BottomSheetRef.current?.present();
  const { dismiss } = useBottomSheetModal();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: themeColors.background,
    },
    addButton: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#007bff",
    },
    timetableLink: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
    },
    timetableText: {
      fontSize: 18,
      color: "#007bff",
    },
    safeAreaView: {
      flex: 1,
      width: "100%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      padding: 20,
    },
  });
  return (
    <View style={styles.container}>
      {/* <CourseForm
        onSubmit={addTimetable}
      /> */}

      <FlatList
        data={timetables}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.timetableLink}
            onPress={() => previewTimetable(item)}
          >
            <Text style={styles.timetableText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      {previewVisible && currentTimetable && (
        <Modal
          visible={previewVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.safeAreaView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TimetableDisplay courses={currentTimetable.courses} />
          </SafeAreaView>
        </Modal>
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.navigate("CourseForm")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default TimetableScreen;
