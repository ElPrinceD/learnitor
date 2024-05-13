import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { RootParamList } from "../../../components/types";
import ApiUrl from "../../../config";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";

interface Plan {
  id: number;
  title: string;
  duedate: string;
  category: number;
}

const Timeline: React.FC = () => {
  const navigation = useNavigation<RootParamList>();
  const { newPlan } = useLocalSearchParams();
  const [todayPlans, setTodayPlans] = useState<Plan[]>([]);
  const [categoryNames, setCategoryNames] = useState<{ [key: number]: string }>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(false);

  const { userToken } = useAuth();

  const getCategoryColor = (type: string): string => {
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

  const fetchTodayPlans = async (): Promise<void> => {
    setLoading(true);
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const response = await axios.get<Plan[]>(
        `${ApiUrl}:8000/api/learner/tasks/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setTodayPlans(response.data);
    } catch (error) {
      console.error("Error fetching today's plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayPlans();
    fetchCategoryNames();
  }, [userToken]);

  useEffect(() => {
    if (isPlan(newPlan)) {
      setTodayPlans([...todayPlans, newPlan]);
    }
  }, [newPlan]);

  // Type guard function to check if an object is of type Plan
  const isPlan = (obj: any): obj is Plan => {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "id" in obj &&
      "title" in obj &&
      "duedate" in obj &&
      "category" in obj
    );
  };

  const fetchCategoryNames = async (): Promise<void> => {
    try {
      const response = await axios.get<{ id: number; name: string }[]>(
        `${ApiUrl}:8000/api/task/categories/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
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

  const handleEditPlan = (planId: number): void => {
    navigation.navigate("EditTouchScreen", { taskId: planId });
  };

  // const renderSwipeableContent = (plan: Plan, index: number): JSX.Element => {
  //   return (
  //     <Swipeable
  //       key={index}
  //       rightButtons={[
  //         <TouchableOpacity onPress={() => handleEditPlan(plan.id)}>
  //           <View style={[styles.actionButton, styles.editButton]}>
  //             <Feather name="edit" size={24} color="white" />
  //           </View>
  //         </TouchableOpacity>,
  //         <TouchableOpacity onPress={() => handleDeletePlan(plan.id)}>
  //           <View style={[styles.actionButton, styles.deleteButton]}>
  //             <Feather name="trash-2" size={24} color="white" />
  //           </View>
  //         </TouchableOpacity>,
  //       ]}
  //     >
  //       <View style={styles.planContainer}>
  //         <View
  //           style={[
  //             styles.timeMarker,
  //             {
  //               backgroundColor: getCategoryColor(categoryNames[plan.category]),
  //             },
  //           ]}
  //         >
  //           <Text
  //             style={[styles.typeText, { transform: [{ rotate: "180deg" }] }]}
  //           >
  //             {categoryNames[plan.category] || "Unknown Category"}
  //           </Text>
  //         </View>
  //         <View style={styles.planContent}>
  //           <Text style={styles.planTitle}>{plan.title}</Text>
  //           <Text style={styles.planTime}>
  //             {plan.duedate
  //               ? new Date(plan.duedate).toLocaleTimeString([], {
  //                   hour: "2-digit",
  //                   minute: "2-digit",
  //                 })
  //               : ""}
  //           </Text>
  //         </View>
  //       </View>
  //     </Swipeable>
  //   );
  // };

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
      <Text style={styles.sectionTitle}>Today's Plans</Text>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* {todayPlans.map((plan, index) => renderSwipeableContent(plan, index))} */}
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
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: "85%",
    borderRadius: 10,
  },
  editButton: {
    backgroundColor: "green",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  deleteButton: {
    backgroundColor: "red",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  scrollViewContent: {
    flexGrow: 1,
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
