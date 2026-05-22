import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Target, Flame, Crosshair, Trophy, ChevronRight } from 'lucide-react-native';
import type { ProfileInsights } from '../../services/UserStatsApiCalls';
import Colors from '../../constants/Colors';
import { rMS, rS, rV, useShadows } from '../../constants';

interface Props {
  insights: ProfileInsights;
  onViewAll: () => void;
}

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ icon, label, value, iconBg }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <View style={miniStyles(themeColors).stat}>
      <View style={[miniStyles(themeColors).iconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={miniStyles(themeColors).textWrap}>
        <Text style={miniStyles(themeColors).value} numberOfLines={1}>
          {value}
        </Text>
        <Text style={miniStyles(themeColors).label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const miniStyles = (themeColors: any) =>
  StyleSheet.create({
    stat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: rS(10),
      paddingVertical: rV(8),
    },
    iconWrap: {
      width: rMS(36),
      height: rMS(36),
      borderRadius: rMS(11),
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
    },
    value: {
      fontSize: rMS(16),
      fontWeight: '800',
      color: themeColors.text,
      letterSpacing: -0.3,
    },
    label: {
      fontSize: rMS(9),
      fontWeight: '600',
      color: themeColors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: rV(1),
    },
  });

const ProfileInsightsSummary: React.FC<Props> = ({ insights, onViewAll }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const shadow = useShadows();

  const { habits, volume, personal_bests, legacy } = insights;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(24),
      padding: rMS(18),
      gap: rV(4),
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: rV(4),
    },
    cardLabel: {
      fontSize: rMS(9),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
    },
    grid: {
      gap: rV(2),
    },
    gridRow: {
      flexDirection: 'row',
      gap: rS(8),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeColors.border,
      marginVertical: rV(6),
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.tint + '12',
      borderRadius: rMS(16),
      paddingVertical: rV(12),
      gap: rS(6),
    },
    ctaText: {
      fontSize: rMS(13),
      fontWeight: '700',
      color: themeColors.tint,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardLabel}>Quick Insights</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <MiniStat
            icon={<Target size={16} color={themeColors.tint} />}
            iconBg={themeColors.tint + '15'}
            label="Questions"
            value={volume.questions_answered_all_time?.toLocaleString() ?? '0'}
          />
          <MiniStat
            icon={<Flame size={16} color="#F59E0B" />}
            iconBg="#F59E0B18"
            label="Day streak"
            value={String(habits.current_daily_streak)}
          />
        </View>
        <View style={styles.gridRow}>
          <MiniStat
            icon={<Crosshair size={16} color={themeColors.tintSecond || themeColors.tint} />}
            iconBg={(themeColors.tintSecond || themeColors.tint) + '15'}
            label="Accuracy"
            value={`${legacy.accuracy}%`}
          />
          <MiniStat
            icon={<Trophy size={16} color="#8B5CF6" />}
            iconBg="#8B5CF615"
            label="Best game"
            value={
              personal_bests.best_single_game_score != null
                ? personal_bests.best_single_game_score.toLocaleString()
                : '—'
            }
          />
        </View>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={onViewAll}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>View all insights</Text>
        <ChevronRight size={16} color={themeColors.tint} />
      </TouchableOpacity>
    </View>
  );
};

export default memo(ProfileInsightsSummary);
