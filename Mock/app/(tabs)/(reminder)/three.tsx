import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import PlanItem from "../../../components/PlanItem";
import DaySelector from "../../../components/DaySelector";
import TimelineHeader from "../../../components/TimelineHeader";
import { Picker } from "@react-native-picker/picker"; // Import Picker from @react-native-picker/picker

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
  const [categoryNames, setCategoryNames] = useState<{ [key: number]: string }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null); // State for selected category

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

  const fetchTodayPlans = async (date: Date) => {
    setLoading(true);
    try {
      const currentDate = date.toISOString().split("T")[0];
      let apiUrl = `${ApiUrl}:8000/api/learner/tasks/?due_date=${currentDate}`;
      if (selectedCategory !== null) {
        apiUrl += `&category=${selectedCategory}`; // Filter by selected category if it's not null
      }
      const response = await axios.get<Plan[]>(apiUrl, {
        headers: { Authorization: `Token ${userToken?.token}` },
      });
      const sortedPlans = response.data.sort((a, b) => {
        const dateA = new Date(a.due_date + "T" + a.due_time);
        const dateB = new Date(b.due_date + "T" + b.due_time);
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
    }, [userToken, selectedDate, selectedCategory]) // Include selectedCategory in dependency array
  );

  useEffect(() => {
    fetchCategoryNames();
    fetchTodayPlans(selectedDate);
  }, [selectedDate, userToken, selectedCategory]); // Include selectedCategory in dependency array

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
      <DaySelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* <View style={styles.categoryPickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          >
            <Picker.Item label="All Categories" value={null} />
            {Object.entries(categoryNames).map(([categoryId, categoryName]) => (
              <Picker.Item key={categoryId} label={categoryName} value={parseInt(categoryId)} />
            ))}
          </Picker>
        </View> */}
        {todayPlans.map((plan, index) => (
          <View key={index} style={styles.planItemContainer}>
            <PlanItem
              plan={plan}
              categoryNames={categoryNames}
              getCategoryColor={getCategoryColor}
              handleDeletePlan={handleDeletePlan}
              handleEditPlan={handleEditPlan}
            />
          </View>
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
    paddingBottom: 200,
  },
  planItemContainer: {
    marginVertical: 10,
  },
  categoryPickerContainer: {
    alignSelf: "flex-end",
    marginRight: 20,
  },
  picker: {
    height: 50,
    width: 150,
  },
});

export default Timeline;
