import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import {
  getTodayPlans,
  getCategoryNames,
} from "../../../services/TimelineApiCalls";
import { useAuth } from "../../../components/AuthContext";
import PlanItem from "../../../components/PlanItem";
import DaySelector from "../../../components/DaySelector";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTimeline } from "../../../contexts/TimelineContext";
import { CalendarOff } from "lucide-react-native";
import ErrorMessage from "../../../components/ErrorMessage";
import ScreenLoadingSpinner from "../../../components/ScreenLoadingSpinner";

const Timeline = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bottomSheetReady, setBottomSheetReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [hasAnimatedBefore, setHasAnimatedBefore] = useState(false);

  const { userToken } = useAuth();
  const { cancelAllNotifications, listScheduledNotifications } = useTimeline();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const BottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "80%"], []);

  const getCategoryColor = (type: any) => {
    switch (type) {
      case "Assignments & Projects":
        return themeColors.text;
      case "TimeTable":
        return "#ed892e";
      case "Study TimeTable":
        return "#6c77f4";
      case "Exams TimeTable":
        return "#a96ae3";
      default:
        return "#000";
    }
  };

  const {
    data: todayPlans,
    status: plansStatus,
    error: plansError,
    refetch: refetchTodayPlans,
  } = useQuery({
    queryKey: ["todayPlans", userToken?.token],
    queryFn: () =>
      getTodayPlans(userToken?.token, selectedDate, selectedCategory),
    enabled: !!userToken,
  });

  const {
    data: categoryNames,
    status: categoriesStatus,
    error: categoriesError,
    refetch: refetchCategoryNames,
  } = useQuery({
    queryKey: ["categoryNames", userToken],
    queryFn: () => getCategoryNames(userToken?.token),
    enabled: !!userToken,
  });

  // Check if user has seen bottom sheet animation before
  useEffect(() => {
    const checkAnimationHistory = async () => {
      try {
        const hasAnimated = await AsyncStorage.getItem("bottomSheetAnimated");
        setHasAnimatedBefore(hasAnimated === "true");
      } catch (error) {}
    };

    checkAnimationHistory();
  }, []);

  // Initialize BottomSheet
  useEffect(() => {
    const timer = setTimeout(() => {
      setBottomSheetReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Handle BottomSheet errors and force fallback if needed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!bottomSheetReady) {
        setUseFallback(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [bottomSheetReady]);

  // Reset fallback when component remounts (only if not animated before)
  useFocusEffect(
    useCallback(() => {
      if (!hasAnimatedBefore) {
        setUseFallback(false);
        setBottomSheetReady(false);

        const timer = setTimeout(() => {
          setBottomSheetReady(true);
        }, 100);

        return () => clearTimeout(timer);
      } else {
        // If user has seen animation before, just ensure bottom sheet is ready
        setBottomSheetReady(true);
        setUseFallback(false);
      }
    }, [hasAnimatedBefore])
  );

  useEffect(() => {
    if (categoriesStatus === "success" && categoryNames) {
    }
    if (categoriesStatus === "error" && categoriesError) {
    }
  }, [categoriesStatus, categoryNames, categoriesError]);

  const typedCategoryNames = categoryNames as
    | Record<number, string>
    | undefined;

  useEffect(() => {
    if (userToken && selectedDate) {
      refetchTodayPlans();
      refetchCategoryNames();
    }
  }, [userToken, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      if (userToken) {
        refetchTodayPlans();
        refetchCategoryNames();
      }
    }, [userToken])
  );

  useEffect(() => {
    if (plansStatus === "error" || categoriesStatus === "error") {
      setErrorMessage(
        plansError?.message || categoriesError?.message || "An error occurred"
      );
    } else {
      setErrorMessage(null);
    }
  }, [plansStatus, categoriesStatus]);

  const handleEditPlan = (plan: any) => {
    // Handle different possible time field names
    const startTime = plan.due_time_start || plan.due_time || "12:00";
    const endTime = plan.due_time_end || plan.due_time || "13:00";

    // Pass parameters directly in the navigation call
    router.navigate({
      pathname: "EditPlan",
      params: {
        taskId: String(plan.id),
        title: plan.title,
        description: plan.description,
        duedate: plan.due_date,
        category_id: String(plan.category),
        due_time_start: startTime,
        due_time_end: endTime,
        category_name:
          typedCategoryNames?.[plan.category] || "Unknown Category",
        // Add recurring task information
        is_recurring: String(plan.is_recurring || false),
        recurrence_interval: plan.recurrence_interval || null,
        recurrence_end_date: plan.recurrence_end_date || null,
      },
    });
  };

  const memoizedPlans = useMemo(() => {
    if (plansStatus === "success" && typedCategoryNames) {
      return todayPlans || [];
    }
    return [];
  }, [todayPlans, plansStatus, typedCategoryNames]);

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  // BottomSheet callbacks
  const handleBottomSheetChange = useCallback((index: number) => {}, []);

  const handleBottomSheetAnimate = useCallback(
    async (fromIndex: number, toIndex: number) => {
      // Mark that user has seen the animation (only on first animation)
      if (!hasAnimatedBefore && toIndex >= 0) {
        try {
          await AsyncStorage.setItem("bottomSheetAnimated", "true");
          setHasAnimatedBefore(true);
        } catch (error) {}
      }
    },
    [hasAnimatedBefore]
  );

  // Optional: Function to reset animation state (for testing or user preference)
  const resetAnimationState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("bottomSheetAnimated");
      setHasAnimatedBefore(false);
    } catch (error) {
      console.log("Error resetting animation state:", error);
    }
  }, []);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    scrollViewContent: { flexGrow: 1 },
    bottom: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: rMS(32),
      borderTopRightRadius: rMS(32),
    },
    plansContainer: { marginTop: rV(14), paddingHorizontal: rS(4) },
    planItemWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: rV(4),
    },
    planTime: {
      marginHorizontal: rS(10),
      textAlign: "left",
      color: themeColors.textSecondary,
      alignSelf: "flex-start",
      fontWeight: "600",
      fontSize: rMS(11),
    },
    noPlansContainer: {
      alignItems: "center",
      paddingVertical: rV(32),
    },
    noPlansIcon: {
      width: rMS(56),
      height: rMS(56),
      borderRadius: rMS(28),
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(12),
    },
    noPlansText: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
      textAlign: "center",
      letterSpacing: -0.2,
    },
    noPlansSubtext: {
      fontSize: rMS(12),
      fontWeight: "600",
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(4),
    },
    planItemLine: {
      position: "absolute",
      top: rV(-10),
      left: 0,
      right: 0,
      height: 0.3,
      backgroundColor: themeColors.border + "30",
    },
    addButton: {
      position: "absolute",
      right: rS(20),
      bottom: rV(20),
      width: rMS(56),
      height: rMS(56),
      borderRadius: rMS(28),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.tint,
      ...shadow.medium,
    },
  });

  // Fallback content component
  const renderFallbackContent = useCallback(
    () => (
      <ScrollView
        style={[styles.bottom, { flex: 1 }]}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.plansContainer}>
          {plansStatus === "pending" ? (
            <ScreenLoadingSpinner />
          ) : memoizedPlans.length === 0 ? (
            <View style={styles.noPlansContainer}>
              <View style={styles.noPlansIcon}>
                <CalendarOff size={24} color={themeColors.textSecondary} />
              </View>
              <Text style={styles.noPlansText}>You have a free day!</Text>
              <Text style={styles.noPlansSubtext}>No plans scheduled</Text>
            </View>
          ) : (
            memoizedPlans.map(
              (plan: any, index: number) =>
                plan && (
                  <View key={index} style={styles.planItemWrapper}>
                    {typedCategoryNames && (
                      <PlanItem
                        plan={plan}
                        categoryNames={typedCategoryNames}
                        getCategoryColor={getCategoryColor}
                        handleEditPlan={handleEditPlan}
                      />
                    )}
                  </View>
                )
            )
          )}
        </View>
      </ScrollView>
    ),
    [
      plansStatus,
      memoizedPlans,
      typedCategoryNames,
      getCategoryColor,
      handleEditPlan,
      styles,
    ]
  );

  return (
    <View style={styles.container}>
      <DaySelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      {!bottomSheetReady ? (
        // Loading state while BottomSheet initializes
        <ScreenLoadingSpinner />
      ) : useFallback ? (
        // Fallback ScrollView when BottomSheet fails
        renderFallbackContent()
      ) : (
        // BottomSheet with improved configuration
        <BottomSheet
          ref={BottomSheetRef}
          snapPoints={snapPoints}
          index={1}
          backgroundStyle={{ backgroundColor: themeColors.background }}
          handleIndicatorStyle={{ backgroundColor: themeColors.tint }}
          onChange={handleBottomSheetChange}
          onAnimate={handleBottomSheetAnimate}
          enablePanDownToClose={false}
          enableOverDrag={false}
          animateOnMount={!hasAnimatedBefore}
          style={{ zIndex: 1 }}
        >
          <BottomSheetScrollView
            style={[styles.bottom]}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.plansContainer}>
              {plansStatus === "pending" ? (
                <ScreenLoadingSpinner />
              ) : memoizedPlans.length === 0 ? (
                <View style={styles.noPlansContainer}>
                  <View style={styles.noPlansIcon}>
                    <CalendarOff size={24} color={themeColors.textSecondary} />
                  </View>
                  <Text style={styles.noPlansText}>You have a free day!</Text>
                  <Text style={styles.noPlansSubtext}>No plans scheduled</Text>
                </View>
              ) : (
                memoizedPlans.map(
                  (plan: any, index: number) =>
                    plan && (
                      <View key={index} style={styles.planItemWrapper}>
                        {typedCategoryNames && (
                          <PlanItem
                            plan={plan}
                            categoryNames={typedCategoryNames}
                            getCategoryColor={getCategoryColor}
                            handleEditPlan={handleEditPlan}
                          />
                        )}
                      </View>
                    )
                )
              )}
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      )}

      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          visible={!!errorMessage}
          onDismiss={handleDismissError}
        />
      )}
    </View>
  );
};

export default Timeline;
