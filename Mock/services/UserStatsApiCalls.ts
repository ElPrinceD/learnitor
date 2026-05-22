import axios from 'axios';
import ApiUrl from '../config';

const apiClient = axios.create({
  baseURL: ApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TypicalStudyTime {
  label: string;
  hour_start: number;
  hour_end: number;
}

export interface ProfileInsightsHabits {
  current_daily_streak: number;
  active_days_this_season: number;
  season_total_days: number;
  best_daily_streak_ever: number;
  most_active_day_of_week: string | null;
  typical_study_time: TypicalStudyTime | null;
}

export interface ProfileInsightsVolume {
  questions_answered_all_time: number;
}

export interface ProfileInsightsPersonalBests {
  best_single_game_score: number | null;
  best_session_streak: number | null;
  best_weekly_exam_score: number | null;
  best_weekly_exam_global_average: number | null;
  world_rank_jump_this_season: number | null;
}

export interface ProfileInsightsCourse {
  id: number;
  title: string;
  share_percent: number;
}

export interface ProfileInsightsTopic {
  id: number;
  title: string;
  accuracy_percent: number;
}

export interface ProfileInsightsLearning {
  top_course: ProfileInsightsCourse | null;
  strongest_topic: ProfileInsightsTopic | null;
}

export interface ProfileInsightsSquadHighlights {
  top_three_count: number;
  squads_count: number;
}

export interface ProfileInsightsCompetitive {
  games_single_player: number;
  games_multiplayer: number;
  multiplayer_wins: number;
  multiplayer_losses: number;
  weekly_exams_taken: number;
  weekly_exams_total: number;
  weekly_exam_streak_weeks: number;
  squad_highlights: ProfileInsightsSquadHighlights;
  vs_squad_weekly_exam_percent: number | null;
}

export interface ProfileInsightsLegacy {
  accuracy: number;
  sessions: number;
  streak_avg: number;
  streak_avg_delta: number;
  tier: string;
}

export interface ProfileInsights {
  member_since: string | null;
  habits: ProfileInsightsHabits;
  volume: ProfileInsightsVolume;
  personal_bests: ProfileInsightsPersonalBests;
  learning: ProfileInsightsLearning;
  competitive: ProfileInsightsCompetitive;
  legacy: ProfileInsightsLegacy;
}

export interface PracticeSessionCompleteBody {
  topic_id: number;
  course_id: number;
  level: string;
  questions_count: number;
  correct_count: number;
  duration_seconds?: number;
}

/** Dev / offline fallback when profile-insights is not implemented yet. */
export const MOCK_PROFILE_INSIGHTS: ProfileInsights = {
  member_since: '2024-03-15T00:00:00Z',
  habits: {
    current_daily_streak: 12,
    active_days_this_season: 18,
    season_total_days: 30,
    best_daily_streak_ever: 21,
    most_active_day_of_week: 'Tuesday',
    typical_study_time: { label: '8–10 PM', hour_start: 20, hour_end: 22 },
  },
  volume: {
    questions_answered_all_time: 4820,
  },
  personal_bests: {
    best_single_game_score: 1420,
    best_session_streak: 11,
    best_weekly_exam_score: 980,
    best_weekly_exam_global_average: 840,
    world_rank_jump_this_season: 47,
  },
  learning: {
    top_course: { id: 3, title: 'Biology', share_percent: 64 },
    strongest_topic: { id: 12, title: 'Cell Structure', accuracy_percent: 92 },
  },
  competitive: {
    games_single_player: 84,
    games_multiplayer: 31,
    multiplayer_wins: 19,
    multiplayer_losses: 12,
    weekly_exams_taken: 9,
    weekly_exams_total: 12,
    weekly_exam_streak_weeks: 4,
    squad_highlights: { top_three_count: 2, squads_count: 2 },
    vs_squad_weekly_exam_percent: 12,
  },
  legacy: {
    accuracy: 74.2,
    sessions: 1204,
    streak_avg: 4.82,
    streak_avg_delta: 0.12,
    tier: 'Pro Tier',
  },
};

export const getProfileInsights = async (
  token: string | null | undefined
): Promise<ProfileInsights> => {
  try {
    const response = await apiClient.get<ProfileInsights>(
      '/api/user/profile-insights',
      { headers: { Authorization: `Token ${token}` } }
    );
    return response.data;
  } catch (err) {
    console.warn('profile-insights fetch failed, using mock:', err);
    return MOCK_PROFILE_INSIGHTS;
  }
};

export const submitPracticeSession = async (
  token: string | null | undefined,
  body: PracticeSessionCompleteBody
): Promise<void> => {
  await apiClient.post(
    '/api/learner/practice/session-complete',
    body,
    { headers: { Authorization: `Token ${token}` } }
  );
};
