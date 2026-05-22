import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '../../../components/AuthContext';
import Colors from '../../../constants/Colors';
import { rMS, rS, rV } from '../../../constants';
import {
  getProfileInsights,
  MOCK_PROFILE_INSIGHTS,
} from '../../../services/UserStatsApiCalls';
import ProfileInsightsBody from '../../../components/profile/ProfileInsightsBody';
import { formatMemberSince } from '../../../components/profile/profileCopy';

const ProfileInsightsPage = () => {
  const { userToken } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const token = userToken?.token;

  const { data: insights = MOCK_PROFILE_INSIGHTS, isLoading } = useQuery({
    queryKey: ['profileInsights', token],
    queryFn: () => getProfileInsights(token),
    enabled: !!token,
  });

  const memberSinceLine = formatMemberSince(insights.member_since);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: rV(16),
      paddingBottom: Math.max(rV(40), insets.bottom + rV(20)),
    },
    heroMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: rV(20),
    },
    tierBadge: {
      backgroundColor: themeColors.tint + '18',
      paddingHorizontal: rMS(12),
      paddingVertical: rV(5),
      borderRadius: rMS(12),
    },
    tierText: {
      fontSize: rMS(10),
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: themeColors.tint,
    },
    memberSince: {
      fontSize: rMS(10),
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: rV(80),
    },
    insightsBlock: {
      gap: rV(12),
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tier badge + member since */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          style={styles.heroMeta}
        >
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{insights.legacy.tier}</Text>
          </View>
          {memberSinceLine ? (
            <Text style={styles.memberSince}>{memberSinceLine}</Text>
          ) : null}
        </Animated.View>

        {/* Full insights */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(150)}
          style={styles.insightsBlock}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={themeColors.tint} />
            </View>
          ) : (
            <ProfileInsightsBody insights={insights} />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default ProfileInsightsPage;
