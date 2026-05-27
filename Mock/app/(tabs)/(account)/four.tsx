import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Menu,
  Camera,
  X,
  BadgeCheck,
  Globe,
  Flag,
  School,
} from "lucide-react-native";
import { router } from "expo-router";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useAuth } from "../../../components/AuthContext";
import * as ImagePicker from "expo-image-picker";
import ApiUrl from "../../../config";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import { useErrorHandler } from "../../../hooks/useErrorHandler";
import {
  getProfileInsights,
  MOCK_PROFILE_INSIGHTS,
} from "../../../services/UserStatsApiCalls";
import { getRankingsSummary } from "../../../services/LeaderboardApiCalls";
import ProfileInsightsSummary from "../../../components/profile/ProfileInsightsSummary";
import { formatMemberSince } from "../../../components/profile/profileCopy";
import ScreenLoadingSpinner from "../../../components/ScreenLoadingSpinner";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SeasonEntry {
  season_name: string;
  final_score: number;
  rank: number;
  maxScore?: number;
}

const parseRankString = (field: any): string => {
  if (!field) return "—";
  if (typeof field === "object" && field !== null) {
    return field.rank || "—";
  }
  return String(field);
};

const Profile = () => {
  const { userToken, userInfo, setUserInformation, setUserInfo } = useAuth();
  const { handleError } = useErrorHandler();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [imageUpdateKey, setImageUpdateKey] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | undefined>(
    userInfo?.user.profile_picture
  );

  const token = userToken?.token;

  const { data: insights = MOCK_PROFILE_INSIGHTS, isLoading: insightsLoading } =
    useQuery({
      queryKey: ["profileInsights", token],
      queryFn: () => getProfileInsights(token),
      enabled: !!token,
    });

  const { data: rankings = { world: "#142", country: "#12", school: "#01" } } =
    useQuery({
      queryKey: ["rankingsSummary", token],
      queryFn: async () => {
        try {
          return await getRankingsSummary(token);
        } catch {
          return { world: "#142", country: "#12", school: "#01" };
        }
      },
      enabled: !!token,
    });

  const MOCK_SEASON_HISTORY: SeasonEntry[] = [
    { season_name: "Season 03", final_score: 14290, rank: 112, maxScore: 17000 },
    { season_name: "Season 02", final_score: 12105, rank: 304, maxScore: 17000 },
    { season_name: "Season 01", final_score: 9842, rank: 540, maxScore: 17000 },
  ];

  const { data: seasonHistory = MOCK_SEASON_HISTORY } = useQuery({
    queryKey: ["seasonHistory", token],
    queryFn: async () => {
      try {
        const res = await axios.get<SeasonEntry[]>(
          `${ApiUrl}/api/user/season-history`,
          { headers: { Authorization: `Token ${token}` } }
        );
        return res.data;
      } catch {
        return MOCK_SEASON_HISTORY;
      }
    },
    enabled: !!token,
  });

  const memberSinceLine = formatMemberSince(insights.member_since);
  const tier = insights.legacy.tier;

  // Settings icon press scale
  const settingsScale = useSharedValue(1);
  const settingsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsScale.value }],
  }));

  useEffect(() => {
    if (
      userInfo?.user.profile_picture &&
      userInfo.user.profile_picture.trim() !== ""
    ) {
      setCurrentImageUri(userInfo.user.profile_picture);
    } else {
      setCurrentImageUri(undefined);
    }
  }, [userInfo?.user.profile_picture]);

  const handleProfilePictureUpdate = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const formData = new FormData();
        const fileName = uri.split("/").pop() || "image";
        const fileType = fileName.split(".").pop() || "jpg";

        formData.append("profile_picture", {
          uri,
          name: fileName,
          type: `image/${fileType}`,
        } as any);

        const config = {
          headers: {
            Authorization: `Token ${userToken?.token}`,
            "Content-Type": "multipart/form-data",
          },
        };

        const response = await axios.patch(
          `${ApiUrl}/api/update/user/${userInfo?.user.id}/`,
          formData,
          config
        );

        if (userInfo) {
          setCurrentImageUri(undefined);
          setImageLoading(true);
          setImageError(false);

          const updatedUserInfo = {
            ...userInfo,
            user: {
              ...userInfo?.user,
              profile_picture: response.data.profile_picture,
            },
          };

          setUserInformation(updatedUserInfo);
          setUserInfo(updatedUserInfo);

          setImageUpdateKey((prev) => {
            const newKey = prev + 1;
            setTimeout(() => {
              setCurrentImageUri(
                `${response.data.profile_picture}?cacheKey=${newKey}`
              );
            }, 100);
            return newKey;
          });
        }
      }
    } catch (error) {
      handleError(error, "Update Failed");
    }
  };

  const handleProfilePictureDelete = async () => {
    try {
      await axios.delete(`${ApiUrl}/api/delete-profile-picture/`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });

      if (userInfo) {
        setCurrentImageUri(undefined);
        setImageLoading(false);
        setImageError(false);

        const updatedUserInfo = {
          ...userInfo,
          user: {
            ...userInfo?.user,
            profile_picture: "",
          },
        };

        setUserInformation(updatedUserInfo);
        setUserInfo(updatedUserInfo);
        setImageUpdateKey((prev) => prev + 1);
      }
    } catch (error: any) {
      handleError(error, "Delete Failed");
    }
  };

  const getProgressPercent = (score: number, maxScore?: number) => {
    const max = maxScore || 17000;
    return Math.min((score / max) * 100, 100);
  };

  const standingsData = [
    {
      label: "World",
      sublabel: "Global Leaderboard",
      IconComponent: Globe,
      iconBg: themeColors.tint + "15",
      iconColor: themeColors.tint,
      rank: rankings.world,
    },
    {
      label: "Country",
      sublabel: "National Ranking",
      IconComponent: Flag,
      iconBg: (themeColors.tintSecond || themeColors.tint) + "15",
      iconColor: themeColors.tintSecond || themeColors.tint,
      rank: rankings.country,
    },
    {
      label: "School",
      sublabel: "Institutional Ranking",
      IconComponent: School,
      iconBg: themeColors.tint + "20",
      iconColor: themeColors.tint,
      rank: rankings.school,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(12), insets.top + rV(8)) + rMS(36) + rV(12),
      paddingBottom: Math.max(rV(40), insets.bottom + rV(20)),
    },
    // Top bar
    topBar: {
      position: "absolute",
      top: Math.max(rV(12), insets.top + rV(8)),
      right: rS(16),
      zIndex: 10,
    },
    settingsBtn: {
      width: rMS(36),
      height: rMS(36),
      borderRadius: rMS(12),
      backgroundColor: themeColors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    // Profile header
    profileHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: rS(16),
      marginBottom: rV(24),
    },
    avatarContainer: {
      position: "relative",
    },
    avatar: {
      width: rMS(100),
      height: rMS(100),
      borderRadius: rMS(28),
      backgroundColor: themeColors.card,
    },
    cameraIcon: {
      position: "absolute",
      bottom: -2,
      right: -2,
      backgroundColor: themeColors.background,
      borderRadius: 14,
      padding: 5,
    },
    deleteIcon: {
      position: "absolute",
      top: -2,
      left: -2,
      backgroundColor: themeColors.background,
      borderRadius: 14,
      padding: 5,
    },
    imageLoadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
      borderRadius: rMS(28),
      justifyContent: "center",
      alignItems: "center",
    },
    profileInfo: {
      flex: 1,
      paddingBottom: rV(4),
    },
    levelBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(4),
      backgroundColor: themeColors.tint + "18",
      paddingHorizontal: rMS(10),
      paddingVertical: rV(3),
      borderRadius: rMS(16),
      alignSelf: "flex-start",
      marginBottom: rV(8),
    },
    levelBadgeText: {
      fontSize: rMS(8),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: themeColors.tint,
    },
    profileName: {
      fontSize: rMS(28),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -1,
      lineHeight: rMS(30),
    },
    profileId: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      fontWeight: "500",
      letterSpacing: 0.5,
      marginTop: rV(4),
    },
    memberSinceFooter: {
      alignItems: "center",
      paddingVertical: rV(20),
      marginTop: rV(8),
    },
    memberSinceText: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    insightsBlock: {
      gap: rV(12),
      marginBottom: rV(8),
    },
    insightsLoading: {
      paddingVertical: rV(40),
      alignItems: "center",
    },
    // Standings section
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: rV(14),
    },
    sectionTitle: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    sectionAction: {
      fontSize: rMS(9),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: themeColors.tint,
    },
    standingCard: {
      backgroundColor: themeColors.card,
      padding: rMS(14),
      borderRadius: rMS(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(8),
    },
    standingCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(12),
    },
    standingIconBox: {
      width: rMS(36),
      height: rMS(36),
      borderRadius: rMS(10),
      alignItems: "center",
      justifyContent: "center",
    },
    standingLabel: {
      fontSize: SIZES.small,
      fontWeight: "700",
      color: themeColors.text,
    },
    standingSublabel: {
      fontSize: rMS(8),
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: themeColors.textSecondary,
      marginTop: rV(1),
    },
    standingRank: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.tint,
    },
    // Season section
    seasonSection: {
      marginTop: rV(8),
      marginBottom: rV(16),
    },
    seasonScroll: {
      marginHorizontal: -rS(4),
    },
    seasonScrollContent: {
      paddingHorizontal: rS(4),
      gap: rS(12),
    },
    seasonCard: {
      width: rS(140),
      backgroundColor: themeColors.card,
      padding: rMS(16),
      borderRadius: rMS(24),
      justifyContent: "space-between",
    },
    seasonCardActive: {
      backgroundColor: themeColors.tint + "12",
    },
    seasonName: {
      fontSize: rMS(9),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
      marginBottom: rV(12),
    },
    seasonScore: {
      fontSize: rMS(18),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.5,
    },
    seasonScoreLabel: {
      fontSize: rMS(8),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
      marginTop: rV(2),
      marginBottom: rV(12),
    },
    seasonBarTrack: {
      height: rV(4),
      backgroundColor: themeColors.background,
      borderRadius: 2,
      overflow: "hidden",
    },
    seasonBarFill: {
      height: "100%",
      borderRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      {/* Top Bar — Settings Icon (fixed, outside scroll) */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(50)}
        style={styles.topBar}
      >
        <AnimatedTouchable
          style={[styles.settingsBtn, settingsAnimStyle]}
          onPress={() => router.navigate("SettingsPage")}
          onPressIn={() => {
            settingsScale.value = withSpring(0.9, {
              damping: 15,
              stiffness: 300,
            });
          }}
          onPressOut={() => {
            settingsScale.value = withSpring(1, {
              damping: 15,
              stiffness: 300,
            });
          }}
          activeOpacity={1}
        >
          <Menu size={20} color={themeColors.text} />
        </AnimatedTouchable>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.profileHeader}
        >
          <TouchableOpacity
            onPress={handleProfilePictureUpdate}
            style={styles.avatarContainer}
            activeOpacity={0.8}
          >
            <View key={`profile-image-${imageUpdateKey}`}>
              <Image
                source={
                  currentImageUri
                    ? { uri: currentImageUri }
                    : require("../../../assets/images/profile-placeholder.png")
                }
                style={styles.avatar}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => {
                  setImageLoading(false);
                  setImageError(false);
                }}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Camera
                size={16}
                color={themeColors.icon}
              />
            </View>
            {currentImageUri && (
              <TouchableOpacity
                onPress={handleProfilePictureDelete}
                style={styles.deleteIcon}
              >
                <X size={14} color="#DC2626" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.levelBadge}>
                <BadgeCheck
                  size={12}
                  color={themeColors.tint}
                />
              <Text style={styles.levelBadgeText}>{tier}</Text>
            </View>
            <Text style={styles.profileName} numberOfLines={1}>
              {userInfo?.user.first_name} {userInfo?.user.last_name}
            </Text>
            {userInfo?.user.username ? (
              <Text style={styles.profileId}>
                @{userInfo.user.username}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        {/* Profile insights summary */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={styles.insightsBlock}
        >
          {insightsLoading ? (
            <View style={styles.insightsLoading}>
              <ScreenLoadingSpinner style={{ flex: 0, paddingVertical: rV(20) }} />
            </View>
          ) : (
            <ProfileInsightsSummary
              insights={insights}
              onViewAll={() => router.navigate("ProfileInsights")}
            />
          )}
        </Animated.View>

        {/* Global Standings */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Global Standings</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(game)/Leaderboard",
                  params: { id: "world", name: "World Rankings" },
                })
              }
            >
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          {standingsData.map((item, index) => (
            <Animated.View
              key={item.label}
              entering={FadeInDown.duration(400).delay(350 + index * 60)}
            >
              <TouchableOpacity
                style={styles.standingCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(game)/LeaderboardDetail",
                    params: {
                      id: item.label.toLowerCase(),
                      name:
                        item.label.toLowerCase() === "school"
                          ? "School Ranking"
                          : item.label,
                      timeframe: "season",
                    },
                  })
                }
              >
                <View style={styles.standingCardLeft}>
                  <View
                    style={[
                      styles.standingIconBox,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <item.IconComponent
                      size={20}
                      color={item.iconColor}
                    />
                  </View>
                  <View>
                    <Text style={styles.standingLabel}>{item.label}</Text>
                    <Text style={styles.standingSublabel}>
                      {item.sublabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.standingRank}>
                  {parseRankString(item.rank)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Season Performance */}
        {seasonHistory.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(550)}
            style={styles.seasonSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Season Performance</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.seasonScroll}
              contentContainerStyle={styles.seasonScrollContent}
            >
              {seasonHistory.map((season, index) => {
                const progress = getProgressPercent(
                  season.final_score,
                  season.maxScore
                );
                const isFirst = index === 0;
                return (
                  <View
                    key={index}
                    style={[
                      styles.seasonCard,
                      isFirst && styles.seasonCardActive,
                    ]}
                  >
                    <Text style={styles.seasonName}>{season.season_name}</Text>
                    <View>
                      <Text
                        style={[
                          styles.seasonScore,
                          !isFirst && { color: themeColors.textSecondary },
                        ]}
                      >
                        {season.final_score.toLocaleString()}
                      </Text>
                      <Text style={styles.seasonScoreLabel}>Points</Text>
                    </View>
                    <View style={styles.seasonBarTrack}>
                      <View
                        style={[
                          styles.seasonBarFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: isFirst
                              ? themeColors.tint
                              : themeColors.textSecondary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Member since — bottom of page */}
        {memberSinceLine ? (
          <Animated.View
            entering={FadeInDown.duration(500).delay(600)}
            style={styles.memberSinceFooter}
          >
            <Text style={styles.memberSinceText}>{memberSinceLine}</Text>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default Profile;
