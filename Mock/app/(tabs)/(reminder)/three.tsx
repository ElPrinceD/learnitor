// Timeline.tsx
import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import PlanItem from "../../../components/PlanItem";
import DaySelector from "../../../components/DaySelector";
import Header from "../../../components/TimelineHeader";

interface Plan {
  id: number;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  category: number;
}

const Timeline: React.FC = () => {
  const days = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
  const [todayPlans, setTodayPlans] = useState<Plan[]>([]);
  const [categoryNames, setCategoryNames] = useState<{ [key: number]: string }>(
    {}
  );
  const [selectedDay, setSelectedDay] = useState(
    days[(new Date().getDay() - 1) % 7]
  );
  const [loading, setLoading] = useState(false);

  const { userToken } = useAuth();

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "Assignments & Projects":
        return "#FF6347";
      case "TimeTable":
        return "#FFA500";
      case "Study TimeTable":
        return "#00BFFF";
      case "Exams TimeTable":
        return "#8A2BE2";
      default:
        return "#000000";
    }
  };

  const fetchTodayPlans = async () => {
    setLoading(true);
    try {
      const selectedIndex = days.indexOf(selectedDay);
      const today = new Date();
      const currentDay = today.getDay();
      const diff = selectedIndex + 1 - currentDay;
      today.setDate(today.getDate() + diff);
      const currentDate = today.toISOString().split("T")[0];

      const response = await axios.get<Plan[]>(
        `${ApiUrl}:8000/api/learner/tasks/?due_date=${currentDate}`,
        {
          headers: { Authorization: `Token ${userToken?.token}` },
        }
      );
      console.log(currentDate);
      setTodayPlans(response.data);
    } catch (error) {
      console.error("Error fetching today's plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const selectedIndex = days.indexOf(selectedDay);
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + selectedIndex);
    const formattedDate = currentDate.toISOString().split("T")[0];
    fetchCategoryNames();
    fetchTodayPlans();
  }, [selectedDay, userToken]);

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
      fetchTodayPlans();
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
  };

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

  return (
    <View style={styles.container}>
      <Header />
      <DaySelector
        days={days}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {todayPlans.map((plan, index) => (
          <PlanItem
            key={index}
            plan={plan}
            categoryNames={categoryNames}
            getCategoryColor={getCategoryColor}
            handleDeletePlan={handleDeletePlan}
            handleEditPlan={handleEditPlan}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    marginBottom: 200,
  },
});

export default Timeline;
