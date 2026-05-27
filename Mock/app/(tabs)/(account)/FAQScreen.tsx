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
import { Search, ChevronUp, ChevronDown } from "lucide-react-native";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../../constants";
import ScreenLoadingSpinner from "../../../components/ScreenLoadingSpinner";

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
    question: "How do I open leaderboards and study squads?",
    answer:
      'Go to the "Play" tab to access your world, country, and school leaderboards. You can also create or join study squads there using a squad code.',
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
  {
    id: "25",
    question: "What can I do in the Play section?",
    answer:
      'The Play section is your competition hub. You can start regular game sessions, take the Weekly Exam when it is open, view world/country/school leaderboards, and create or join Study Squads. It is the best place to track how you rank against others.',
  },
  {
    id: "26",
    question: "When is the Weekly Exam available?",
    answer:
      "The Weekly Exam appears based on its live window. Before it opens, you will see an upcoming state; during the live window, the exam button becomes active; after you finish, it shows completed; and after the window closes, it is no longer available for that week.",
  },
  {
    id: "27",
    question: "How do exam start and end times appear?",
    answer:
      'In Play, the exam timing is shown in your local timezone so it is easier to follow. You will see messages like "Starts ..." before the exam opens and "Ends ..." while it is active.',
  },
  {
    id: "28",
    question: "What are the key Weekly Exam rules?",
    answer:
      "Each question is timed, and you are expected to complete the exam in one attempt once you begin. The exam is designed to run continuously, so do not plan to pause and return later. Submit your best effort in one session for the week.",
  },
  {
    id: "29",
    question: "What leaderboards are available in Play?",
    answer:
      "You can follow your rank on World, Country, and School leaderboards. If you join squads, you also get squad-specific competition views. Together, these boards help you compare global performance and your local community progress.",
  },
  {
    id: "30",
    question: "What does SW mean on leaderboards?",
    answer:
      "SW refers to your Study Week score, which reflects your Weekly Exam performance for the current week. It appears alongside points on leaderboard rows so you can compare exam outcomes as well as total ranking strength.",
  },
  {
    id: "31",
    question: "What is the difference between Rankings and Knockout views?",
    answer:
      "Rankings show leaderboard positions based on points and exam performance. Knockout views focus on head-to-head style competition formats in supported squad modes. The tab you see depends on the type of competition you are viewing.",
  },
  {
    id: "32",
    question: "What are squad scoring modes?",
    answer:
      "When creating a squad, you can choose All Points, Exam Only, or H2H League. All Points combines broader gameplay performance, Exam Only focuses on Weekly Exam results, and H2H League is built for battle-style matchups and standings.",
  },
  {
    id: "33",
    question: "How do seasons affect my ranking?",
    answer:
      "Some leaderboard views emphasize current-season performance, while others can show all-time context. In general, season views help you measure recent momentum, and all-time views show your longer-term progress.",
  },
  {
    id: "34",
    question: "How do I create or join a Study Squad?",
    answer:
      "Open Play and use the Study Squad actions to either create a new squad or join with an invite code. Creating a squad gives you a code you can share, and joining only requires a valid code from an existing squad.",
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
      "Make sure notifications are enabled in your device settings and that you've granted app permission. You can also review your learning reminder preference in Privacy Settings.",
  },

  // Settings and Privacy
  {
    id: "15",
    question: "How do I manage my consent settings?",
    answer:
      'Go to the "Profile" tab, open Settings, and tap "Privacy Settings". From there, you can review and manage your consent preferences.',
  },
  {
    id: "16",
    question: "What are the different consent types?",
    answer:
      "Privacy Settings includes Essential App Functionality (always on), Learning Reminders, App Improvement, Updates and Tips, and Personalized Ads.",
  },
  {
    id: "17",
    question: "How do I update my profile information?",
    answer:
      'Go to the "Profile" tab and open Settings > Account Settings to update your name, email, username, and school. Profile picture updates are handled on the main Profile screen.',
  },
  {
    id: "18",
    question: "How do I report a problem with the app?",
    answer:
      'Go to the "Profile" tab, open Settings, and tap "Report a Problem". Fill out the form with details about the issue, and our team will look into it.',
  },
  {
    id: "19",
    question: "What if I forget my password?",
    answer:
      'On the login screen, tap "Forgot Password?", enter your email, verify the reset code you receive, then set a new password.',
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
      'Try closing and reopening the app. If the problem persists, restart your device. You can also report the issue through "Report a Problem" under Profile > Settings.',
  },
  {
    id: "23",
    question: "Why is my new username not saving?",
    answer:
      "Your username must be 3 to 30 characters, use only letters, numbers, or underscores, and have no spaces. It also has to be available before you can save.",
  },
  {
    id: "24",
    question: "What happens if I delete my account?",
    answer:
      "Account deletion is permanent. Your account data is removed, you are signed out, and you will be returned to the intro screen.",
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

  const renderFAQItem = ({ item }: { item: any }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity
        onPress={() => toggleFAQ(item.id)}
        style={styles.questionContainer}
      >
        <Text style={[styles.questionText, { color: themeColors.text }]}>
          {item.question}
        </Text>
        <View style={styles.chevronContainer}
        >
        {expandedFAQ === item.id ? (
          <ChevronUp size={20} color={themeColors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={themeColors.textSecondary} />
        )}
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
      marginBottom: rV(16),
    },
    headerTitle: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(6),
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      fontWeight: "500",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(16),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      borderRadius: rMS(16),
      paddingHorizontal: rS(14),
      paddingVertical: rV(8),
      backgroundColor: themeColors.cardGlass,
    },
    searchInput: {
      flex: 1,
      fontSize: rMS(14),
      fontWeight: "500",
    },
    searchIcon: {
      marginLeft: rS(8),
    },
    clearButton: {
      padding: rS(4),
    },
    faqItem: {
      marginBottom: rV(8),
    },
    questionContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: rS(14),
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(16),
      borderWidth: 1,
      borderColor: themeColors.border + "30",
    },
    questionText: {
      fontSize: rMS(13),
      fontWeight: "700",
      flex: 1,
      marginRight: rS(10),
      letterSpacing: -0.1,
    },
    chevronContainer: {
      paddingTop: rS(2),
    },
    answerContainer: {
      paddingHorizontal: rS(14),
      paddingVertical: rV(10),
      backgroundColor: themeColors.background,
      borderBottomLeftRadius: rMS(16),
      borderBottomRightRadius: rMS(16),
    },
    answerText: {
      fontSize: rMS(12),
      lineHeight: rV(20),
      fontWeight: "500",
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
      fontSize: rMS(14),
      fontWeight: "600",
    },
    emptySubtext: {
      textAlign: "center",
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      marginTop: rV(8),
      fontWeight: "500",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: rV(12),
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      fontWeight: "600",
    },
    resultsCount: {
      paddingHorizontal: rS(16),
      paddingBottom: rV(8),
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      fontWeight: "600",
    },
  });
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ScreenLoadingSpinner style={{ flex: 0, paddingVertical: 0 }} />
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
        <Search
          size={18}
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
