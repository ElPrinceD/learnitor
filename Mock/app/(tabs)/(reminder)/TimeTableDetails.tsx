import React from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Text,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../components/AuthContext";
import { getTimetable } from "../../../TimelineApiCalls";
import Colors from "../../../constants/Colors";
import TimetableDisplay from "../../../components/TimetableDisplay";
import { router, useLocalSearchParams } from "expo-router";
import { rMS, rS, rV, SIZES } from "../../../constants";
import ErrorMessage from "../../../components/ErrorMessage"; // Assuming you have this component
import GameButton from "../../../components/GameButton";
import { FontAwesome6 } from "@expo/vector-icons";

interface Period {
  course_name: string;
  lecturer: string;
  days: string;
  venue: string;
  start_time: string;
  end_time: string;
}

interface Timetable {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  periods: Period[];
  join_link?: string;
}

const TimetableDetailPage = () => {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { timetableId } = useLocalSearchParams();

  const {
    data: timetable,
    isLoading,
    isError,
  } = useQuery<Timetable, Error>({
    queryKey: ["timetable", timetableId],
    queryFn: () => getTimetable(Number(timetableId), userToken?.token!),
  });

  React.useEffect(() => {
    if (isError) {
      setErrorMessage("An error occurred while fetching the timetable");
    } else {
      setErrorMessage(null);
    }
  }, [isError]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      padding: rMS(15),
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: 10,
    },
    description: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    editButton: {
      position: "absolute",
      right: rS(20),
      bottom: rV(75),
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.buttonBackground,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (!timetable) {
    return (
      <View style={styles.container}>
        <Text>Timetable not found</Text>
      </View>
    );
  }
  console.log(timetable.periods);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{timetable.name}</Text>
      <Text style={styles.description}>{timetable.description}</Text>
      <TimetableDisplay periods={timetable.periods} />
      <GameButton
        style={styles.editButton}
        onPress={() =>
          router.push({
            pathname: "EditPeriods",
            params: { timetableId: timetable.id },
          })
        }
      >
        <FontAwesome6
          name="edit"
          size={SIZES.xLarge}
          color={themeColors.text}
        />
      </GameButton>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
};

export default TimetableDetailPage;
