import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Text,
  useColorScheme,
  FlatList,
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
import { SIZES, rMS, rS, rV } from "../../../constants";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Plan {
  id: number;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  category: number;
}

const Timeline: React.FC = () => {
  const [todayPlans, setTodayPlans] = useState<Plan[]>([]);
  const [categoryNames, setCategoryNames] = useState<{ [key: number]: string }>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [month, setMonth] = useState<string>("");
  const today = new Date();
  const { userToken } = useAuth();
  const scrollY = useSharedValue(0);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const getMonthName = (date: Date): string => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[date.getMonth()];
  };

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
      let apiUrl = `${ApiUrl}:8000/api/learner/tasks/?due_date=${currentDate}`;
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
  useEffect(() => {
    setMonth(getMonthName(selectedDate));
  }, [selectedDate]);

  const fetchCategoryNames = async () => {
    try {
      const response = await axios.get<{ id: number; name: string }[]>(
        `${ApiUrl}:8000/api/task/categories/`,
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

  const handleDeletePlan = async (planId: number): Promise<void> => {
    try {
      await axios.delete(`${ApiUrl}:8000/api/tasks/${planId}/`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      fetchTodayPlans(selectedDate);
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
  };

  const handleEditPlan = (plan: Plan) => {
    router.navigate("TimeTable");
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
  const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekDays = getWeekDays(selectedDate);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const handleScroll = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(newDate);
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
  };

  const smallCalendarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 320, 340],
      [0, 0.01, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [320, 340],
      [-20, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // borderBottomLeftRadius: 30,
      backgroundColor: themeColors.background,
    },
    scrollViewContent: {
      flexGrow: 1,
    },
    bottom: {
      backgroundColor: themeColors.background,
      flex: 1,
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
      height: 0.8,
      backgroundColor: themeColors.border,
    },
    smallCalendar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: themeColors.tint,
      padding: rMS(10),
    },
    month: {
      fontSize: rMS(23),
      fontWeight: "bold",
      textAlign: "center",
    },
    selectorContainer: {
      marginTop: rV(5),
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(10),
    },
    dayContainer: {
      alignItems: "center",
      marginHorizontal: rS(8),
    },
    date: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    selectedDay: {
      color: "#1434A4",
      fontWeight: "bold",
    },
    today: {
      fontWeight: "bold",
      color: "#FF6347",
    },
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView scrollEventThrottle={1} onScroll={scrollHandler}>
        <DaySelector
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          y={scrollY}
        />
        <View style={[styles.bottom]}>
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
        </View>
      </Animated.ScrollView>
      <Animated.View style={[smallCalendarStyle, styles.smallCalendar]}>
        <Text style={styles.month}>{month}</Text>
        <View style={styles.selectorContainer}>
          <TouchableOpacity onPress={() => handleScroll("prev")}>
            <MaterialCommunityIcons
              name="code-less-than"
              size={SIZES.xLarge}
              color={themeColors.text}
            />
          </TouchableOpacity>
          <FlatList
            data={weekDays}
            horizontal
            keyExtractor={(item) => item.toISOString()}
            renderItem={({ item: date }) => {
              const isToday = date.toDateString() === today.toDateString();
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  onPress={() => handleDayPress(date)}
                  style={styles.dayContainer}
                >
                  <Text
                    style={[
                      styles.date,
                      isSelected && styles.selectedDay,
                      isToday && styles.today,
                    ]}
                  >
                    {days[date.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.date,
                      isSelected && styles.selectedDay,
                      isToday && styles.today,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            }}
            showsHorizontalScrollIndicator={false}
          />
          <TouchableOpacity onPress={() => handleScroll("next")}>
            <MaterialCommunityIcons
              name="code-greater-than"
              size={SIZES.xLarge}
              color={themeColors.text}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default Timeline;
