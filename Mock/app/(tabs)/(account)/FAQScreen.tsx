// File: FAQScreen.tsx

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../../constants";

// FAQ data based on actual app features
const faqData = [
  // Courses and Learning
  {
    id: "1",
    question: "How do I browse and enroll in courses?",
    answer:
      'Go to the "Learn" tab to see all available courses. You can browse by category, search for specific topics, and tap on any course to view details and enroll.',
  },
  {
    id: "2",
    question: "What types of course content are available?",
    answer:
      "Each course contains topics with three types of materials: Videos, Books, and Articles. You can access these materials by tapping on a topic within your enrolled course.",
  },
  {
    id: "3",
    question: "How do I track my course progress?",
    answer:
      "Your course progress is displayed in the course roadmap, showing completed topics and overall completion percentage. You can also see your progress on the home screen.",
  },
  {
    id: "4",
    question: "What is the course roadmap?",
    answer:
      "The roadmap shows your learning path through a course, displaying all topics in order. It helps you see what you've completed and what's coming next in your learning journey.",
  },

  // Practice and Questions
  {
    id: "5",
    question: "How do I practice with questions?",
    answer:
      "From any course topic, you can access practice questions at different levels: Beginner, Intermediate, Advanced, and Master.",
  },
  {
    id: "6",
    question: "What types of practice questions are available?",
    answer:
      "Practice questions include multiple choice questions with single or multiple correct answers. You can take timed or untimed practice sessions based on your preference.",
  },
  {
    id: "7",
    question: "Can I see my practice scores?",
    answer:
      "Yes! After completing practice questions, you'll see your score and can review which answers were correct or incorrect to help improve your understanding.",
  },

  // Games
  {
    id: "8",
    question: "How do I play learning games?",
    answer:
      'Tap the game controller icon in the top right of the "Relax" tab to access games. You can create a new game or join an existing one using a game code.',
  },
  {
    id: "9",
    question: "How do multiplayer games work?",
    answer:
      "You can create a game and share the code with friends, or join someone else's game using their code. Games include power-ups like 'Ask Prince' and 'Double Dip' to help during gameplay.",
  },
  {
    id: "10",
    question: "What are the game power-ups?",
    answer:
      "Games include special power-ups: 'Ask Prince' gives you AI assistance on a question, and 'Double Dip' allows you to select two answers instead of one.",
  },

  // Tasks and Reminders
  {
    id: "11",
    question: "How do I create a new task or reminder?",
    answer:
      'Go to the "To Do" tab and tap the "+" button to create a new task. You can set the title, description, date, time, and choose whether it repeats.',
  },
  {
    id: "12",
    question: "How do I edit or delete an existing task?",
    answer:
      'In the "To Do" tab, swipe to the left on any task to open the edit screen. From there, you can modify the task details or delete it using the delete button.',
  },
  {
    id: "13",
    question: "Can I view my tasks in a timeline?",
    answer:
      "Yes! The timeline view shows your tasks organized by date and time, making it easy to see your schedule at a glance. You can also filter by category.",
  },
  {
    id: "14",
    question: "Why am I not receiving notifications for my tasks?",
    answer:
      "Make sure notifications are enabled in your device settings and that you've granted permission to the app. You can also check your notification preferences in the consent settings.",
  },

  // Settings and Privacy
  {
    id: "15",
    question: "How do I manage my consent settings?",
    answer:
      'Go to the "Settings" tab and tap "Consent Settings". From there, you can control essential functionality, learning reminders, app improvement data, and marketing communications.',
  },
  {
    id: "16",
    question: "What are the different consent types?",
    answer:
      "Essential functionality (always enabled), learning reminders, app improvement data, and marketing communications. You can toggle each type on or off based on your preferences.",
  },
  {
    id: "17",
    question: "How do I update my profile information?",
    answer:
      'Go to the "Settings" tab and tap on your profile section. You can update your name, email, and profile picture from there.',
  },
  {
    id: "18",
    question: "How do I report a problem with the app?",
    answer:
      'Go to the "Settings" tab and tap "Report Problem". Fill out the form with details about the issue, and our team will look into it.',
  },
  {
    id: "19",
    question: "What if I forget my password?",
    answer:
      'On the login screen, tap "Forgot Password?" and enter your email address. You\'ll receive instructions to reset your password via email.',
  },
  {
    id: "20",
    question: "Can I use the app without an internet connection?",
    answer:
      "You can view your tasks and some cached content offline. However, you'll need an internet connection to sync changes, access courses, play games, and receive notifications.",
  },
  {
    id: "21",
    question: "How do I change the app theme (dark/light mode)?",
    answer:
      "The app automatically follows your device's system theme settings. You can change this in your device's display settings.",
  },
  {
    id: "22",
    question: "What should I do if the app crashes or freezes?",
    answer:
      'Try closing and reopening the app. If the problem persists, restart your device. You can also report the issue through the "Report Problem" feature in the Settings tab.',
  },
];

const FAQScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter FAQ based on search query with memoization for performance
  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return faqData;

    return faqData.filter(
      (item) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const renderFAQItem = ({ item }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity
        onPress={() => toggleFAQ(item.id)}
        style={styles.questionContainer}
      >
        <Text style={[styles.questionText, { color: themeColors.text }]}>
          {item.question}
        </Text>
        <View style={styles.chevronContainer}>
          <Ionicons
            name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"}
            size={24}
            color={themeColors.text}
          />
        </View>
      </TouchableOpacity>
      {expandedFAQ === item.id && (
        <View style={styles.answerContainer}>
          <Text
            style={[styles.answerText, { color: themeColors.textSecondary }]}
          >
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rS(16),
    },
    header: {
      marginBottom: rV(20),
    },
    headerTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(8),
    },
    headerSubtitle: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(20),
      borderWidth: 1,
      borderColor: "#ccc",
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
    clearButton: {
      padding: rS(4),
    },
    faqItem: {
      marginBottom: rV(15),
    },
    questionContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: rS(10),
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: rMS(8),
    },
    questionText: {
      fontSize: rS(16),
      fontWeight: "bold",
      flex: 1,
      marginRight: rS(10),
    },
    chevronContainer: {
      paddingTop: rS(2),
    },
    answerContainer: {
      padding: rS(10),
      backgroundColor: themeColors.background,
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
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(40),
    },
    emptyIcon: {
      marginBottom: rV(16),
    },
    emptyText: {
      textAlign: "center",
      padding: rV(20),
      fontSize: rS(16),
    },
    emptySubtext: {
      textAlign: "center",
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginTop: rV(8),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: rV(12),
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
    },
    resultsCount: {
      paddingHorizontal: rS(16),
      paddingBottom: rV(8),
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
  });
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={styles.loadingText}>Loading FAQs...</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              color: themeColors.text,
              backgroundColor: themeColors.background,
            },
          ]}
          placeholder="Search FAQs"
          placeholderTextColor={themeColors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons
          name="search"
          size={20}
          color={themeColors.textSecondary}
          style={styles.searchIcon}
        />
      </View>
      <FlatList
        data={filteredFAQs}
        renderItem={renderFAQItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text
            style={[styles.emptyText, { color: themeColors.textSecondary }]}
          >
            No FAQs found matching your search.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default FAQScreen;
