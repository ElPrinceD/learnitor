import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {  useGlobalSearchParams } from "expo-router";
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { RootParamList } from "../../../components/types"; 
import apiUrl from '@/config';



interface Category {
  id: string;
  name: string;
}

const CategoryList = () => {
  const { width } = Dimensions.get('window');
  const [categories, setCategories] = useState([]);
  const params = useGlobalSearchParams();
  const token = params.token;

  

  // Fetch categories from the API endpoint
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}:8000/api/task/categories/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setCategories(response.data.map((category: Category)=> ({
        ...category,
        color: getCategoryColor(category.name),
        icon: getCategoryIcon(category.name),
      })));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };


  const navigation = useNavigation<RootParamList>();
  
  const handleCategoryPress = (category: Category) => {
    
    navigation.navigate("createNewTime", { name : category.name, category_id: category.id });
    
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'Assignments & Projects':
        return '#FF6347'; // Red
      case 'TimeTable':
        return '#FFA500'; // Orange
      case 'Study TimeTable':
        return '#00BFFF'; // Blue
      case 'Exams TimeTable':
        return '#8A2BE2'; // Purple
      default:
        return '#000000'; // Black (default color)
    }
  };

  // Function to get icon name based on category type
  const getCategoryIcon = (type) => {
    switch (type) {
      case 'Exams TimeTable':
        return 'flame';
      case 'TimeTable':
        return 'briefcase';
      case 'Assignments & Projects':
        return 'people';
      case 'Study TimeTable':
        return 'book';
      default:
        return 'help-circle'; // Default icon name
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []); // Fetch categories only once when the component mounts

  return (
    <View style={styles.container}>
    <Text style={styles.title}>Select category to remind</Text>
    <View style={styles.categoriesContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryBox,
            {
              backgroundColor: category.color,
              width: (width - 40) / 2,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                },
                android: {
                  elevation: 5,
                },
              }),
            },
          ]}
          onPress={() => handleCategoryPress(category)} // Handle press event
        >
          <Ionicons name={category.icon} size={40} color="#fff" />
          <Text style={styles.categoryText}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryBox: {
    height: 160,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    ...Platform.select({
      ios: {
        backgroundColor: '#fff',
      },
    }),
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
});

export default CategoryList;
