import React, { useEffect, useState } from "react";
import ApiUrl from "../../../config.js";
import axios from "axios";
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from "../../../components/AuthContext";
import { Feather } from '@expo/vector-icons';



interface Plan {
    id: number;
    title: string;
    description: string;
    duedate: string;
    category: number;
  }

const Schedule = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];
  const [todayPlans, setTodayPlans] = useState<Plan[]>([]);
  const [categoryNames, setCategoryNames] = useState<{ [key: number]: string }>({});
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
    
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const response = await axios.get<Plan[]>(`${ApiUrl}:8000/api/learner/tasks/`, {
        headers: {
          Authorization: `Token ${userToken?.token}` 
        },
      });
      setTodayPlans(response.data);
    } catch (error) {
      console.error("Error fetching today's plans:", error);
    } 
  };

  useEffect(() => {
    fetchTodayPlans();
    fetchCategoryNames();
  }, [userToken]);

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


  const renderPlanContent = (plan: Plan, index: number) => {
    
    return (
      <GestureHandlerRootView>
        <Swipeable

        onSwipeableWillOpen={(direction) => {
          if (direction === 'left') {
            handleEditPlan((plan.id));
          } else if (direction === 'right') {
            handleDeletePlan((plan.id));
          }
        }}
        
          renderRightActions={() => (
            <>
             
              <TouchableOpacity
                
                style={styles.deleteButton}
                
              >
                <Feather name="trash-2" size={24} color="white" />
              </TouchableOpacity>
            </>
          )}

          renderLeftActions={() =>  <TouchableOpacity
                onPress={() => handleEditPlan(plan.id)}
                style={styles.editButton}
              >
                <Feather name="edit" size={24} color="white" />
              </TouchableOpacity>}
        >
          <View style={styles.planContainer} key={index}>
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
                {plan.duedate ? new Date(plan.duedate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </Text>
            </View>
          </View>
        </Swipeable>
      </GestureHandlerRootView>
    );
    
  };
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#065806', '#065806']}
        style={styles.gradient}
      />
      <View style={styles.touchableContainer}>
        {days.map((day, index) => (
          <TouchableOpacity key={index} style={styles.touchableButton}>
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
    alignItems: 'center', 
    
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  gradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: '100%',
    height: 100,
    
  },
  planContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
  touchableContainer: {
    marginTop: -20,

    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    paddingBottom: 10, 
    borderRadius: 30,
    width: '90%',
    
  },
  touchableButton: {
    borderRadius: 10,
  },
  touchableText: {
    color: '#272e27',
    fontSize: 24,
    fontWeight: 'bold',
    padding: 5,
  },
});

export default Schedule;
