import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert, Text } from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import PlanItem from "../../../components/PlanItem";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
        return "#0d1116"; // Red
      case "TimeTable":
        return "#ed892e"; // Orange
      case "Study TimeTable":
        return "#6c77f4"; // Blue
      case "Exams TimeTable":
        return "#a96ae3"; // Purple
      default:
        return "#000000"; // Black (default color)
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
    console.log(taskIdString)
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
      {/* <TimelineHeader /> */}
      <DaySelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <View style={[styles.bottom]}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.plansContainer}>
  {todayPlans.length === 0 ? (
    <Text style={styles.noPlansText}>Hey, you have a free day!</Text>
  ) : (
    todayPlans.map((plan, index) => {
      const categoryColor = getCategoryColor(categoryNames[plan.category]);
      return (
        <View key={index} style={styles.planItemWrapper}>
          <Text style={styles.planTime}>{plan.due_time.slice(0, -3)}</Text>
          {/* <View style={[styles.planItemContainer, { backgroundColor: categoryColor }]}> */}
            <View style={styles.planItemLine}/>
            <PlanItem
              plan={plan}
              categoryNames={categoryNames}
              getCategoryColor={getCategoryColor}
              handleDeletePlan={handleDeletePlan}
              handleEditPlan={handleEditPlan}
            />
          </View>
        // </View>
      );
    })
  )}
</View>
      </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 50,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 50,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    
  },
  bottom:{
    height: "100%", 
    marginTop: -55,
    width: "100%", 
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    backgroundColor: "white"
  },
  plansContainer: {
    // backgroundColor: "#FFFFFF", // White background for the entire plans container
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    
    padding: 10,
    
    marginTop: 20,
  },
  planItemWrapper: {
    flexDirection: 'row', // Align time and plan item side by side
    alignItems: 'center',
    marginVertical: 10,
  },
  planTime: {
    width: 50, // Fixed width for the time
    textAlign: 'center',
    color: "#1f1f1f",
    marginTop: -100
  },
  noPlansText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    
    textAlign: 'center',
    paddingVertical: 20,
  },
  planItemContainer: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planItemLine: {
    position: 'absolute',
    
    top: -10, // Adjust this value to move the line higher or lower
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ccc',
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
