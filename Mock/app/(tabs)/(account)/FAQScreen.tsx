// File: FAQScreen.tsx

import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants";

// Sample FAQ data
const faqData = [
  { id: '1', question: 'How do I sign up for the app?', answer: 'To sign up, open the app, tap on "Sign Up", and follow the prompts to enter your email and create a password.' },
  { id: '2', question: 'What if I forget my password?', answer: 'If you forget your password, go to the login screen, tap on "Forgot Password?", and follow the instructions to reset it via email.' },
  { id: '3', question: 'Can I use the app offline?', answer: 'Yes, certain features of the app are available offline. However, for full functionality, an internet connection is required.' },
 
  { id: '4', question: 'How do I access course materials?', answer: 'Course materials can be accessed from the "Courses" tab. Select a course, and youll find all related materials under the "Resources" section.' },
  { id: '5', question: 'Is there a community feature in the app?', answer: 'Yes, we have a community feature where you can join discussions, share insights, and connect with other learners.' },
  { id: '6', question: 'What are the system requirements for the app?', answer: 'The app is designed to work on devices running iOS 12+ or Android 8+. Ensure you have at least 2GB of RAM for optimal performance.' },
  { id: '7', question: 'How can I report a bug or issue?', answer: 'To report an issue, navigate to the "Settings" tab, then "Report an Issue" where you can submit your problem or feedback.' },
  { id: '8', question: 'Can I change my subscription plan?', answer: 'Yes, you can change your subscription plan at any time from the "Account" section in "Settings".' },
  { id: '9', question: 'How do I update my profile information?', answer: 'Go to "Settings", then "Account", where you can edit your profile details like name, email, and profile picture.' },
  { id: '10', question: 'What payment methods do you accept?', answer: 'We accept payments via credit card, PayPal, and Apple Pay for iOS users. Android users can also use Google Pay.' },
];

const FAQScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Filter FAQ based on search query
  const filteredFAQs = faqData.filter(
    (item) => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const renderFAQItem = ({ item }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity onPress={() => toggleFAQ(item.id)} style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: themeColors.text }]}>{item.question}</Text>
        <Ionicons name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"} size={24} color={themeColors.text} />
      </TouchableOpacity>
      {expandedFAQ === item.id && (
        <View style={styles.answerContainer}>
          <Text style={[styles.answerText, { color: themeColors.textSecondary }]}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: themeColors.text, backgroundColor: themeColors.card }]}
          placeholder="Search FAQs"
          placeholderTextColor={themeColors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
      </View>
      <FlatList
        data={filteredFAQs}
        renderItem={renderFAQItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No FAQs found matching your search.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: rS(16),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rV(20),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: rMS(8),
    paddingHorizontal: rS(10),
    paddingVertical: rV(5),
  },
  searchInput: {
    flex: 1,
    fontSize: rS(16),
  },
  searchIcon: {
    marginLeft: rS(10),
  },
  faqItem: {
    marginBottom: rV(15),
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: rS(10),
    backgroundColor: '#f0f0f0',
    borderRadius: rMS(8),
  },
  questionText: {
    fontSize: rS(16),
    fontWeight: 'bold',
  },
  answerContainer: {
    padding: rS(10),
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: rMS(8),
    borderBottomRightRadius: rMS(8),
  },
  answerText: {
    fontSize: rS(14),
    lineHeight: rV(20),
  },
  listContainer: {
    paddingBottom: rV(20),
  },
  emptyText: {
    textAlign: 'center',
    padding: rV(20),
    fontSize: rS(16),
  },
});

export default FAQScreen;