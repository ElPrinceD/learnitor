import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import PlanItem from "../../../components/PlanItem";
import DaySelector from "../../../components/DaySelector";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FontAwesome6 } from "@expo/vector-icons";
import { Plan } from "../../../components/types";

const Timeline: React.FC = () => {
  const [todayPlans, setTodayPlans] = useState<Plan[]>([]);
  const [categoryNames, setCategoryNames] = useState<{ [key: number]: string }>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { userToken } = useAuth();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const getCategoryColor = (type: string) => {
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

  const fetchTodayPlans = async (date: Date) => {
    setLoading(true);
    try {
      const currentDate = date.toISOString().split("T")[0];
      let apiUrl = `${ApiUrl}/api/learner/tasks/?due_date=${currentDate}`;
      if (selectedCategory !== null) {
        apiUrl += `&category=${selectedCategory}`;
      }
      const response = await axios.get<Plan[]>(apiUrl, {
        headers: { Authorization: `Token ${userToken?.token}` },
      });
      const sortedPlans = response.data.sort((a, b) => {
        const dateA = new Date(a.due_date + "T" + a.due_time);
        const dateB = new Date(b.due_date + "T" + a.due_time);
        return dateA.getTime() - dateB.getTime();
      });
      setTodayPlans(sortedPlans);
    } catch (error) {
      console.error("Error fetching today's plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userToken) {
        fetchTodayPlans(selectedDate);
      }
    }, [userToken, selectedDate, selectedCategory])
  );

  useEffect(() => {
    fetchCategoryNames();
    fetchTodayPlans(selectedDate);
  }, [selectedDate, userToken, selectedCategory]);

  const fetchCategoryNames = async () => {
    try {
      const response = await axios.get<{ id: number; name: string }[]>(
        `${ApiUrl}/api/task/categories/`,
        {
          headers: { Authorization: `Token ${userToken?.token}` },
        }
      );
      const categories = response.data.reduce((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {} as { [key: number]: string });
      setCategoryNames(categories);
    } catch (error) {
      console.error("Error fetching category names:", error);
    }
  };
  const snapPoints = useMemo(() => ["50%", "80%"], []);
  const BottomSheetRef = useRef<BottomSheet>(null);

  const handleEditPlan = (plan: Plan) => {
    router.navigate("EditPlan");
    const taskIdString = String(plan.id);
    router.setParams({
      taskId: taskIdString,
      title: plan.title,
      description: plan.description,
      duedate: plan.due_date,
      category_id: String(plan.category),
      duetime: plan.due_time,
      category_name: categoryNames[plan.category],
    });
  };
  const handleNavigateCreateTask = () => {
    router.navigate("createNewTime");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollViewContent: {
      flexGrow: 1,
    },
    bottom: {
      backgroundColor: themeColors.background,
      // flex: 1,
      borderTopLeftRadius: rMS(40),
      borderTopRightRadius: rMS(40),
    },
    plansContainer: {
      marginTop: rV(18),
    },
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
        // plan={todayPlans}
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
            {todayPlans.length === 0 ? (
              <Text style={styles.noPlansText}>Hey, you have a free day!</Text>
            ) : (
              todayPlans.map((plan, index) => {
                const categoryColor = getCategoryColor(
                  categoryNames[plan.category]
                );
                return (
                  <View key={index} style={styles.planItemWrapper}>
                    <Text style={styles.planTime}>
                      {plan.due_time.slice(0, -3)}
                    </Text>
                    <View style={styles.planItemLine} />
                    <PlanItem
                      plan={plan}
                      categoryNames={categoryNames}
                      getCategoryColor={getCategoryColor}
                      handleEditPlan={handleEditPlan}
                    />
                  </View>
                );
              })
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
    </View>
  );
};

export default Timeline;
