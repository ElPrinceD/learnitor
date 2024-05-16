import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import axios from "axios";
import { Feather } from '@expo/vector-icons';
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { router, useFocusEffect } from 'expo-router';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

interface Plan {
  id: number;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  category: number;
}

const Timeline: React.FC = () => {
 
  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];
  const [todayPlans, setTodayPlans] = useState<Plan[]>([]);
  const [categoryNames, setCategoryNames] = useState<{ [key: number]: string }>({});
  const [selectedDay, setSelectedDay] = useState(days[(new Date().getDay() - 1) % 7]);
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

  console.log(selectedDay);

  const fetchCategoryNames = async () => {
    try {
      const response = await axios.get<{ id: number; name: string }[]>(`${ApiUrl}:8000/api/task/categories/`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      const categories = response.data.reduce((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {} as { [key: number]: string });
      setCategoryNames(categories);
    } catch (error) {
      console.error("Error fetching category names:", error);
    }
  };

  const fetchTodayPlans = async (formattedDate: string) => {
    setLoading(true);
    try {
      const response = await axios.get<Plan[]>(`${ApiUrl}:8000/api/learner/tasks/?due_date=${formattedDate}`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      setTodayPlans(response.data);
    } catch (error) {
      console.error("Error fetching today's plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const selectedIndex = days.indexOf(selectedDay);
      const currentDate = new Date();
      const firstDayOfWeek = currentDate.getDate() - currentDate.getDay() + 1;
      const selectedDate = new Date(currentDate.setDate(firstDayOfWeek + selectedIndex));
      const formattedDate = selectedDate.toISOString().split('T')[0];

      fetchCategoryNames();
      fetchTodayPlans(formattedDate);
    }, [selectedDay, userToken])
  );

  const handleDeletePlan = async (plan: Plan) => {
    try {
      await axios.delete(`${ApiUrl}:8000/api/tasks/${plan.id}/`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      const selectedIndex = days.indexOf(selectedDay);
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + selectedIndex);
      const formattedDate = currentDate.toISOString().split('T')[0];
      fetchTodayPlans(formattedDate);
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
  };

  const handleEditPlan = (plan: Plan) => {
    router.navigate("EditPlan");
    console.log(categoryNames);
    const taskIdString: string = String(plan.id);
    router.setParams({taskId: taskIdString, title: plan.title, description: plan.description, 
      duedate: plan.due_date, category_id: String(plan.category), duetime: plan.due_time, category_name: categoryNames[plan.category]});
  };

  const renderPlanContent = (plan: Plan, index: number) => {
    return (
      <GestureHandlerRootView key={index}>
        <Swipeable    
          renderRightActions={() => (
            <>     
              <TouchableOpacity  
                onPress={() => handleDeletePlan(plan)}
                style={styles.deleteButton}
              >
                <Feather name="trash-2" size={24} color="white" />
              </TouchableOpacity>
            </>
          )}
          renderLeftActions={() =>  
            <TouchableOpacity
              onPress={() => handleEditPlan(plan)}
              style={styles.editButton}
            >
              <Feather name="edit" size={24} color="white" />
            </TouchableOpacity>
          }
        >
          <View style={styles.planContainer}>
            <View
              style={[
                styles.timeMarker,
                {
                  backgroundColor: getCategoryColor(categoryNames[plan.category]),
                },
              ]}
            >
              <Text style={[styles.typeText, { transform: [{ rotate: "180deg" }] }]}>
                {categoryNames[plan.category] || "Unknown Category"}
              </Text>
            </View>
            
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planTime}>
                {plan.due_time ? plan.due_time.slice(0, 5) : ""}        
              </Text>
            </View>
          </View>
        </Swipeable>
      </GestureHandlerRootView>
    ); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.cylinderContainer}>
        <View style={styles.cylinder}>
          <View style={styles.cylinderContent}>
            <Text style={styles.cylinderText}>Easy way to note your task</Text>
          </View>
          <Image
            source={require("../../../assets/images/Notes-amico.png")}
            style={styles.image}
          />
        </View>
      </View>
      <View style={styles.touchableContainer}>
        {days.map((day, index) => (
          <TouchableOpacity key={index} style={[
            styles.touchableButton,
            selectedDay === day && { backgroundColor: 'orange', padding: 10, borderRadius: 17 }
          ]}
          onPress={() => setSelectedDay(day)}>
            <Text style={styles.touchableText}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {todayPlans.map((plan, index) => renderPlanContent(plan, index))}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  planContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  planContent: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginLeft: -18,
    borderRadius: 8,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  planTime: {
    fontSize: 14,
    color: "#777",
  },
  timeMarker: {
    width: 59,
    height: 30,
    borderTopLeftRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "270deg" }],
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    borderRadius: 10,
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
  },
  touchableContainer: {
    marginTop: -70,
    flexDirection: 'row',
    backgroundColor: "#f4f7f3",
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
    borderRadius: 30,
    width: '100%',
  },
  touchableButton: {
    borderRadius: 10,
  },
  touchableText: {
    color: '#145714',
    fontSize: 24,
    fontWeight: 'bold',
    padding: 5,
  },
  editButton: {
    backgroundColor: "green",
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    borderRadius: 10,
  },
  deleteButton: {
    backgroundColor: "red",
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    borderRadius: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
    marginBottom: 200
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 16,
  },
  cylinderContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  cylinder: {
    backgroundColor: "#1f3e4c",
    width: 380,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 90,
    overflow: "hidden",
    flexDirection: "row",
  },
  cylinderContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  cylinderText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  date: {
    color: "#7e2626",
    fontSize: 14,
    backgroundColor: "#ffff",
    paddingTop: 20,
    paddingBottom: 10,
    margin: 10,
    fontWeight: "bold",
  },
});

export default Timeline;
