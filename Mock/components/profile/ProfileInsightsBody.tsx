import React, { memo } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Target } from 'lucide-react-native';
import type { ProfileInsights } from '../../services/UserStatsApiCalls';
import Colors from '../../constants/Colors';
import { rMS, rS, rV } from '../../constants';
import ProfileStatCard from './ProfileStatCard';
import ProfileHeroStat from './ProfileHeroStat';
import ProfileInsightSection from './ProfileInsightSection';
import {
  SECTION,
  formatActiveDays,
  formatMultiplayerRecord,
  formatRankJump,
  formatSquadHighlights,
  formatStrongestTopicSubtitle,
  formatTopCourseSubtitle,
  formatVsSquadAverage,
  formatWeeklyExamLine,
  formatWeeklyExamVsAvg,
} from './profileCopy';

interface Props {
  insights: ProfileInsights;
}

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: rS(12) },
  });
  return <View style={styles.row}>{children}</View>;
};

const ProfileInsightsBody: React.FC<Props> = ({ insights }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { habits, volume, personal_bests, learning, competitive, legacy } =
    insights;

  const styles = StyleSheet.create({
    splitCard: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(24),
      padding: rMS(18),
      gap: rV(12),
    },
    splitLabel: {
      fontSize: rMS(9),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
    },
    splitRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    splitItem: { flex: 1, alignItems: 'center' },
    splitValue: {
      fontSize: rMS(22),
      fontWeight: '800',
      color: themeColors.text,
    },
    splitCaption: {
      fontSize: rMS(9),
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginTop: rV(4),
      textTransform: 'uppercase',
    },
    barTrack: {
      height: rV(6),
      backgroundColor: themeColors.background,
      borderRadius: 3,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    barSingle: {
      backgroundColor: themeColors.tint,
    },
    barMulti: {
      backgroundColor: themeColors.tintSecond || themeColors.tint,
      opacity: 0.7,
    },
    accuracyCard: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(24),
      padding: rMS(18),
      flex: 1,
      justifyContent: 'space-between',
      minHeight: rV(120),
    },
    accuracyValue: {
      fontSize: rMS(26),
      fontWeight: '800',
      color: themeColors.tint,
    },
  });

  const totalGames =
    competitive.games_single_player + competitive.games_multiplayer;
  const singlePct =
    totalGames > 0
      ? Math.round((100 * competitive.games_single_player) / totalGames)
      : 50;
  const multiPct = 100 - singlePct;

  const rankJumpCopy = formatRankJump(personal_bests.world_rank_jump_this_season);
  const vsSquadCopy = formatVsSquadAverage(
    competitive.vs_squad_weekly_exam_percent
  );

  return (
    <>
      {/* Hero — questions all time */}
      <ProfileHeroStat
        label="Questions crushed"
        value={volume.questions_answered_all_time?.toLocaleString() ?? '0'}
        subtext="Practice, games, exams — all of it"
        rightLabel="Status"
        rightBadge={legacy.tier}
        Icon={Target}
      />

      {/* Core stats — accuracy + sessions + streak avg */}
      <ProfileInsightSection
        title={SECTION.coreStats.title}
        subtitle={SECTION.coreStats.subtitle}
      >
        <Row>
          <View style={styles.accuracyCard}>
            <Text style={styles.splitLabel}>Accuracy</Text>
            <Text style={styles.accuracyValue}>{legacy.accuracy}%</Text>
          </View>
          <ProfileStatCard
            label="Sessions"
            value={legacy.sessions?.toLocaleString() ?? '0'}
          />
        </Row>
        <ProfileStatCard
          label="Streak avg"
          value={String(legacy.streak_avg)}
          subtext={
            legacy.streak_avg_delta > 0
              ? `+${legacy.streak_avg_delta} vs last month`
              : 'In-game correct streak average'
          }
          fullWidth
          tall
        />
      </ProfileInsightSection>

      {/* Locked in */}
      <ProfileInsightSection
        title={SECTION.lockedIn.title}
        subtitle={SECTION.lockedIn.subtitle}
      >
        <Row>
          <ProfileStatCard
            label="Day streak"
            value={String(habits.current_daily_streak)}
            subtext="Don't break it."
          />
          <ProfileStatCard
            label="Showed up"
            value={`${habits.active_days_this_season}`}
            subtext={formatActiveDays(
              habits.active_days_this_season,
              habits.season_total_days
            )}
          />
        </Row>
        <Row>
          <ProfileStatCard
            label="Best streak"
            value={String(habits.best_daily_streak_ever)}
            subtext="Days in a row, ever"
          />
          <ProfileStatCard
            label="Peak day"
            value={habits.most_active_day_of_week || '—'}
            subtext="When you show up most"
          />
        </Row>
        <ProfileStatCard
          label="Usual time"
          value={habits.typical_study_time?.label || '—'}
          subtext="When you usually study"
          fullWidth
          tall
        />
      </ProfileInsightSection>

      {/* Your bests */}
      <ProfileInsightSection
        title={SECTION.yourBests.title}
        subtitle={SECTION.yourBests.subtitle}
      >
        <Row>
          <ProfileStatCard
            label="Best game"
            value={
              personal_bests.best_single_game_score != null
                ? personal_bests.best_single_game_score.toLocaleString()
                : '—'
            }
            subtext="Single round high score"
          />
          <ProfileStatCard
            label="Best streak"
            value={
              personal_bests.best_session_streak != null
                ? String(personal_bests.best_session_streak)
                : '—'
            }
            subtext="Correct answers in a row"
          />
        </Row>
        <Row>
          <ProfileStatCard
            label="Best study week"
            value={
              personal_bests.best_weekly_exam_score != null
                ? personal_bests.best_weekly_exam_score.toLocaleString()
                : '—'
            }
            subtext={formatWeeklyExamVsAvg(
              personal_bests.best_weekly_exam_score,
              personal_bests.best_weekly_exam_global_average
            )}
          />
          {rankJumpCopy ? (
            <ProfileStatCard
              label="Climbed the ladder"
              value={`↑ ${personal_bests.world_rank_jump_this_season}`}
              subtext={rankJumpCopy}
            />
          ) : (
            <ProfileStatCard
              label="World climb"
              value="—"
              subtext="Rank up to track your climb"
            />
          )}
        </Row>
      </ProfileInsightSection>

      {/* Your lane */}
      <ProfileInsightSection
        title={SECTION.yourLane.title}
        subtitle={SECTION.yourLane.subtitle}
      >
        <ProfileStatCard
          label="Main course"
          value={learning.top_course?.title || '—'}
          subtext={formatTopCourseSubtitle(learning.top_course)}
          fullWidth
          tall
        />
        <ProfileStatCard
          label="Strongest topic"
          value={learning.strongest_topic?.title || '—'}
          subtext={formatStrongestTopicSubtitle(learning.strongest_topic)}
          fullWidth
          tall
        />
      </ProfileInsightSection>

      {/* In the arena */}
      <ProfileInsightSection
        title={SECTION.inTheArena.title}
        subtitle={SECTION.inTheArena.subtitle}
      >
        <View style={styles.splitCard}>
          <Text style={styles.splitLabel}>Games played</Text>
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <Text style={styles.splitValue}>
                {competitive.games_single_player}
              </Text>
              <Text style={styles.splitCaption}>Solo</Text>
            </View>
            <View style={styles.splitItem}>
              <Text style={styles.splitValue}>
                {competitive.games_multiplayer}
              </Text>
              <Text style={styles.splitCaption}>Multi</Text>
            </View>
          </View>
          {totalGames > 0 ? (
            <View style={styles.barTrack}>
              <View style={[styles.barSingle, { flex: singlePct }]} />
              <View style={[styles.barMulti, { flex: multiPct }]} />
            </View>
          ) : null}
        </View>

        <Row>
          <ProfileStatCard
            label="Multi record"
            value={formatMultiplayerRecord(
              competitive.multiplayer_wins,
              competitive.multiplayer_losses
            )}
            subtext="Wins – losses"
          />
          <ProfileStatCard
            label="Study weeks"
            value={`${competitive.weekly_exams_taken}/${competitive.weekly_exams_total}`}
            subtext={formatWeeklyExamLine(
              competitive.weekly_exams_taken,
              competitive.weekly_exams_total,
              competitive.weekly_exam_streak_weeks
            )}
          />
        </Row>

        <ProfileStatCard
          label="Squad highlights"
          value={
            competitive.squad_highlights.top_three_count > 0
              ? `Top 3 × ${competitive.squad_highlights.top_three_count}`
              : '—'
          }
          subtext={
            vsSquadCopy
              ? `${formatSquadHighlights(competitive.squad_highlights)} · ${vsSquadCopy}`
              : formatSquadHighlights(competitive.squad_highlights)
          }
          fullWidth
          tall
        />
      </ProfileInsightSection>
    </>
  );
};

export default memo(ProfileInsightsBody);
