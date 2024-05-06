import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import axios from "axios";
import ApiUrl from "../../../config";

import { useAuth } from "../../../components/AuthContext";

const Timeline = () => {
  const [todayPlans, setTodayPlans] = useState([]);
  const [categoryNames, setCategoryNames] = useState({});

  const { userToken } = useAuth();

  // Mapping plan types to colors for the blocks
  const getCategoryColor = (type) => {
    console.log(type);
    switch (type) {
      case "Assignments & Projects":
        return "#FF6347"; // Red
      case "TimeTable":
        return "#FFA500"; // Orange
      case "Study TimeTable":
        return "#00BFFF"; // Blue
      case "Exams TimeTable":
        return "#8A2BE2"; // Purple
      default:
        return "#000000"; // Black (default color)
    }
  };
  useEffect(() => {
    const fetchTodayPlans = async () => {
      try {
        const currentDate = new Date().toISOString().split("T")[0];
        const response = await axios.get(`${ApiUrl}:8000/api/learner/tasks/`, {
          // Add any necessary headers, such as authentication token
          headers: {
            Authorization: `Token ${userToken?.token}`, // Replace with your actual token
          },
        });
        setTodayPlans(response.data);
      } catch (error) {
        console.error("Error fetching today's plans:", error);
      }
    };
    const fetchCategoryNames = async () => {
      try {
        const response = await axios.get(
          `${ApiUrl}:8000/api/task/categories/`,
          {
            headers: {
              Authorization: `Token ${userToken?.token}`,
            },
          }
        );
        const categories = {};
        response.data.forEach((category) => {
          categories[category.id] = category.name;
        });
        setCategoryNames(categories);
      } catch (error) {
        console.error("Error fetching category names:", error);
      }
    };

    fetchTodayPlans();
    fetchCategoryNames();
  }, []);

  const getDateComponents = () => {
    const today = new Date();
    const dayInMilliseconds = 24 * 60 * 60 * 1000;
    const pastThreeDays = [
      today,
      new Date(today.getTime() - dayInMilliseconds),
      new Date(today.getTime() - 2 * dayInMilliseconds),
    ];
    const upcomingTwoDays = [
      new Date(today.getTime() + dayInMilliseconds),
      new Date(today.getTime() + 2 * dayInMilliseconds),
    ];
    const dateComponents = [...pastThreeDays, today, ...upcomingTwoDays];
    return dateComponents.map((date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cylinderContainer}>
        <View style={styles.cylinder}>
          <View style={styles.cylinderContent}>
            <Text style={styles.cylinderText}>Easy way to note your task</Text>
            {/* Date components */}
          </View>
          <Image
            source={require("../../../assets/images/Notes-amico.png")} // Replace with your image path
            style={styles.image}
          />
        </View>
      </View>
      <Text style={styles.sectionTitle}>Today's Plans</Text>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {todayPlans.map((plan, index) => (
          <View key={index} style={styles.planContainer}>
            <View
              style={[
                styles.timeMarker,
                {
                  backgroundColor: getCategoryColor(
                    categoryNames[plan.category]
                  ),
                },
              ]}
            >
              <Text
                style={[styles.typeText, { transform: [{ rotate: "180deg" }] }]}
              >
                {categoryNames[plan.category] || "Unknown Category"}
              </Text>
            </View>
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planTime}>
                {plan.duedate
                  ? new Date(plan.duedate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </Text>
            </View>
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
    paddingBottom: 20, // Add paddingBottom to accommodate the plans touching the bottom
  },
  image: {
    width: 200, // Make the image bigger
    height: 200,
    resizeMode: "contain", // Maintain aspect ratio
    marginBottom: 16, // Bring the image down a little
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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
    color: "#777", // Lighter color for time text
  },
  timeMarker: {
    width: 59,
    height: 30,
    borderTopLeftRadius: 9,
    marginRight: 0,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "270deg" }],
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },

  scrollViewContent: {
    flexGrow: 1, // Ensure the ScrollView fills its container vertically
  },
});

export default Timeline;
