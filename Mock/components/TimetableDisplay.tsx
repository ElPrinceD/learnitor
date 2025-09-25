import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Alert,
  useColorScheme,
  ScrollView,
} from "react-native";
import Colors from "../constants/Colors";
import { Swipeable } from "react-native-gesture-handler";
import {
  cancelPeriodForToday,
  uncancelPeriodForToday,
  deletePeriod,
} from "../services/TimelineApiCalls";
import { useAuth } from "./AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { rMS, rS, rV, SIZES } from "../constants";

interface Period {
  id: string;
  course_name: string;
  lecturer: string;
  days: string; // Comma-separated string
  venue: string;
  start_time: string;
  end_time: string;
  cancelled?: boolean;
  canceled_dates: string[]; // Add this field
}

interface TimetableDisplayProps {
  periods: Period[];
  isUserLeader: boolean;
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({
  periods,
  isUserLeader,
}) => {
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
  const { userToken } = useAuth(); // Replace with actual user token

  const today = new Date().toISOString().split("T")[0];

  const formatTime = (timeStr: string) => {
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  const [localPeriods, setLocalPeriods] = React.useState<Period[]>(
    periods.map((period) => ({
      ...period,
      cancelled: period.canceled_dates.includes(today),
    }))
  );
  const [loadingStates, setLoadingStates] = React.useState<
    Record<string, boolean>
  >({});

  // Sync local periods with props when periods change (e.g., new periods added)
  React.useEffect(() => {
    setLocalPeriods(
      periods.map((period) => ({
        ...period,
        cancelled: period.canceled_dates.includes(today),
      }))
    );
  }, [periods, today]);

  const handleDelete = async (periodToDelete: Period) => {
    const loadingKey = `delete_${periodToDelete.id}`;

    try {
      // Set loading state
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

      // Make API call first
      await deletePeriod(periodToDelete.id, userToken?.token);

      // Only remove from UI after successful API call
      setLocalPeriods((prev) =>
        prev.filter((period) => period.id !== periodToDelete.id)
      );
    } catch (error) {
      console.error("Error deleting period:", error);
      Alert.alert("Error", "Failed to delete period. Please try again.");
    } finally {
      // Clear loading state
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleToggleCancel = async (periodToToggle: Period) => {
    const loadingKey = `cancel_${periodToToggle.id}`;
    const originalCancelled = periodToToggle.cancelled;

    try {
      // Set loading state
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

      // Make API call first
      if (originalCancelled) {
        await uncancelPeriodForToday(periodToToggle.id, userToken?.token);
      } else {
        await cancelPeriodForToday(periodToToggle.id, userToken?.token);
      }

      // Only update UI after successful API call
      setLocalPeriods((prev) =>
        prev.map((period) =>
          period.id === periodToToggle.id
            ? {
                ...period,
                cancelled: !period.cancelled,
                canceled_dates: period.cancelled
                  ? period.canceled_dates.filter((date) => date !== today)
                  : [...period.canceled_dates, today],
              }
            : period
        )
      );
    } catch (error) {
      console.error("Error toggling cancel state:", error);
      Alert.alert("Error", "Failed to update period. Please try again.");
    } finally {
      // Clear loading state
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

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
    container: {
      flex: 1,
    },
    daySection: {
      marginBottom: rV(24),
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(16),
      paddingHorizontal: rS(4),
    },
    dayTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginRight: rS(8),
    },
    dayBadge: {
      backgroundColor: themeColors.tint + "20",
      paddingHorizontal: rS(8),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
    },
    dayBadgeText: {
      fontSize: SIZES.small,
      fontWeight: "600",
      color: themeColors.tint,
    },
    periodsContainer: {
      gap: rV(12),
    },
    periodCard: {
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: rMS(12),
      padding: rV(16),
      borderWidth: 1,
      borderColor: themeColors.tint + "20",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cancelledCard: {
      backgroundColor: themeColors.errorText + "10",
      borderColor: themeColors.errorText + "30",
      opacity: 0.7,
    },
    periodHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(12),
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    timeIcon: {
      marginRight: rS(6),
    },
    timeText: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      color: themeColors.text,
    },
    cancelledTimeText: {
      textDecorationLine: "line-through",
      color: themeColors.errorText,
    },
    statusBadge: {
      paddingHorizontal: rS(8),
      paddingVertical: rV(4),
      borderRadius: rMS(8),
    },
    cancelledBadge: {
      backgroundColor: themeColors.errorText + "20",
    },
    activeBadge: {
      backgroundColor: themeColors.tint + "20",
    },
    statusText: {
      fontSize: SIZES.small,
      fontWeight: "600",
    },
    cancelledStatusText: {
      color: themeColors.errorText,
    },
    activeStatusText: {
      color: themeColors.tint,
    },
    courseInfo: {
      marginBottom: rV(8),
    },
    courseName: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      color: themeColors.text,
      marginBottom: rV(4),
    },
    cancelledCourseName: {
      textDecorationLine: "line-through",
      color: themeColors.errorText,
    },
    lecturerInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(6),
    },
    lecturerIcon: {
      marginRight: rS(6),
    },
    lecturerText: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
    venueInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    venueIcon: {
      marginRight: rS(6),
    },
    venueText: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
    actionContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: 160,
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
      fontSize: SIZES.small,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: rV(40),
      paddingHorizontal: rS(20),
    },
    emptyStateIcon: {
      marginBottom: rV(16),
    },
    emptyStateText: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      textAlign: "center",
    },
    loadingCard: {
      opacity: 0.7,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: themeColors.background + "80",
      borderRadius: rMS(12),
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    loadingIcon: {
      transform: [{ rotate: "0deg" }],
    },
  });

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

  const renderPeriod = ({ item }: { item: Period }) => {
    const isDeleting = loadingStates[`delete_${item.id}`];
    const isToggling = loadingStates[`cancel_${item.id}`];
    const isLoading = isDeleting || isToggling;

    const cardContent = (
      <View
        style={[
          styles.periodCard,
          item.cancelled && styles.cancelledCard,
          isLoading && styles.loadingCard,
        ]}
      >
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Ionicons
              name="sync"
              size={20}
              color={themeColors.tint}
              style={styles.loadingIcon}
            />
          </View>
        )}
        <View style={styles.periodHeader}>
          <View style={styles.timeContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={item.cancelled ? themeColors.errorText : themeColors.tint}
              style={styles.timeIcon}
            />
            <Text
              style={[
                styles.timeText,
                item.cancelled && styles.cancelledTimeText,
              ]}
            >
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.cancelled ? styles.cancelledBadge : styles.activeBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.cancelled
                  ? styles.cancelledStatusText
                  : styles.activeStatusText,
              ]}
            >
              {isDeleting
                ? "Deleting..."
                : isToggling
                ? "Updating..."
                : item.cancelled
                ? "Cancelled"
                : "Active"}
            </Text>
          </View>
        </View>

        <View style={styles.courseInfo}>
          <Text
            style={[
              styles.courseName,
              item.cancelled && styles.cancelledCourseName,
            ]}
          >
            {item.course_name}
          </Text>
        </View>

        <View style={styles.lecturerInfo}>
          <Ionicons
            name="person-outline"
            size={14}
            color={themeColors.textSecondary}
            style={styles.lecturerIcon}
          />
          <Text style={styles.lecturerText}>{item.lecturer}</Text>
        </View>

        <View style={styles.venueInfo}>
          <Ionicons
            name="location-outline"
            size={14}
            color={themeColors.textSecondary}
            style={styles.venueIcon}
          />
          <Text style={styles.venueText}>{item.venue}</Text>
        </View>
      </View>
    );

    // Conditionally render Swipeable if the user is a leader
    if (isUserLeader) {
      return (
        <Swipeable
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, item)
          }
        >
          {cardContent}
        </Swipeable>
      );
    } else {
      return cardContent;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {daysOfWeek.map((day) => {
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
          <View key={day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day}</Text>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>
                  {dayPeriods.length} period{dayPeriods.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <View style={styles.periodsContainer}>
              {dayPeriods.map((period, index) => (
                <View
                  key={`${day}-${period.course_name}-${period.start_time}-${period.lecturer}-${index}`}
                >
                  {renderPeriod({ item: period })}
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {localPeriods.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="calendar-outline"
            size={48}
            color={themeColors.textSecondary}
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateText}>No periods scheduled yet</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default TimetableDisplay;
