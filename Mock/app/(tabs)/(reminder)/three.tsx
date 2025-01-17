import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import PlanItem from "../../../components/PlanItem";
import DaySelector from "../../../components/DaySelector";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FontAwesome6 } from "@expo/vector-icons";
import ErrorMessage from "../../../components/ErrorMessage";
import { useWebSocket } from "../../../webSocketProvider";

const Timeline = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { userToken } = useAuth();
  const {
    fetchAndCacheTodayPlans,
    fetchAndCacheCategoryNames,
    getCachedTodayPlans,
    getCachedCategoryNames,
  } = useWebSocket();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const BottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["50%", "80%"], []);

  const getCategoryColor = (type) => {
    switch (type) {
      case "Assignments & Projects":
        return themeColors.text;
      case "TimeTable":
        return "#ed892e";
      case "Study TimeTable":
        return "#6c77f4";
      case "Exams TimeTable":
        return "#a96ae3";
      default:
        return "#000";
    }
  };

  const [todayPlans, setTodayPlans] = useState<any[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<number, string>>(
    {}
  );

  useEffect(() => {
    const fetchData = async () => {
      if (userToken) {
        setIsLoading(true);
        try {
          const newPlans = await fetchAndCacheTodayPlans(
            userToken.token,
            selectedDate,
            selectedCategory
          );
          const newCategoryNames = await fetchAndCacheCategoryNames(
            userToken.token
          );

          setTodayPlans(newPlans);
          setCategoryNames(newCategoryNames);
          setErrorMessage(null);
        } catch (error) {
          setErrorMessage("Failed to fetch data");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [userToken, selectedDate, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      const fetchDataOnFocus = async () => {
        if (userToken) {
          setIsLoading(true);
          try {
            const newPlans = await getCachedTodayPlans(
              selectedDate,
              selectedCategory
            );
            const newCategoryNames = await getCachedCategoryNames();

            setTodayPlans(newPlans);
            setCategoryNames(newCategoryNames);
            setErrorMessage(null);
          } catch (error) {
            setErrorMessage("Failed to fetch cached data");
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchDataOnFocus();
    }, [userToken, selectedDate, selectedCategory])
  );

  const handleEditPlan = (plan: any) => {
    router.navigate("EditPlan");
    router.setParams({
      taskId: String(plan.id),
      title: plan.title,
      description: plan.description,
      duedate: plan.due_date,
      category_id: String(plan.category),
      duetime: plan.due_time_start,
      category_name: categoryNames[plan.category], // Now this directly uses the label
    });
  };

  const handleNavigateCreateTask = () => {
    router.navigate("TimeTable");
  };

  const memoizedPlans = useMemo(() => todayPlans || [], [todayPlans]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    scrollViewContent: { flexGrow: 1 },
    bottom: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: rMS(40),
      borderTopRightRadius: rMS(40),
    },
    plansContainer: { marginTop: rV(18) },
    planItemWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: rV(8),
    },
    planTime: {
      marginHorizontal: rS(10),
      textAlign: "left",
      color: themeColors.textSecondary,
      alignSelf: "flex-start",
    },
    noPlansText: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.textSecondary,
      textAlign: "center",
      paddingVertical: rV(20),
    },
    planItemLine: {
      position: "absolute",
      top: rV(-10),
      left: 0,
      right: 0,
      height: 0.3,
      backgroundColor: "#ccc",
    },
    addButton: {
      position: "absolute",
      right: rS(20),
      bottom: rV(20),
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.buttonBackground,
      ...shadow.medium,
    },
  });

  return (
    <View style={styles.container}>
      <DaySelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <BottomSheet
        ref={BottomSheetRef}
        snapPoints={snapPoints}
        index={1}
        backgroundStyle={{ backgroundColor: themeColors.background }}
        handleIndicatorStyle={{ backgroundColor: themeColors.tint }}
      >
        <BottomSheetScrollView
          style={[styles.bottom]}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.plansContainer}>
            {isLoading ? (
              <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#0D47A1" />
              </View>
            ) : memoizedPlans.length === 0 ? (
              <Text style={styles.noPlansText}>Hey, you have a free day!</Text>
            ) : (
              memoizedPlans.map((plan, index) => (
                <View key={index} style={styles.planItemWrapper}>
                  <PlanItem
                    plan={plan}
                    categoryNames={categoryNames}
                    getCategoryColor={getCategoryColor}
                    handleEditPlan={handleEditPlan}
                  />
                </View>
              ))
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleNavigateCreateTask}
      >
        <FontAwesome6 name="add" size={SIZES.xLarge} color={themeColors.text} />
      </TouchableOpacity>
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </View>
  );
};

export default Timeline;
