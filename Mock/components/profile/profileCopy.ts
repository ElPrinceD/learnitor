import type { ProfileInsights } from '../../services/UserStatsApiCalls';

export const SECTION = {
  lockedIn: { title: 'Locked in', subtitle: 'Your consistency this season' },
  yourBests: { title: 'Your bests', subtitle: 'Personal records' },
  yourLane: { title: 'Your lane', subtitle: 'Where you put in the reps' },
  inTheArena: { title: 'In the arena', subtitle: 'Games & squads' },
  coreStats: { title: 'Core stats', subtitle: 'The usual numbers' },
} as const;

export const formatMemberSince = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.toLocaleString(undefined, { month: 'long' });
  const year = d.getFullYear();
  return `with Elevay since ${month} ${year}`;
};

export const formatActiveDays = (
  active: number,
  total: number
): string => `${active} of ${total} days this season`;

export const formatRankJump = (jump: number | null): string | null => {
  if (jump == null || jump <= 0) return null;
  return `↑ ${jump} spots worldwide this season`;
};

export const formatVsSquadAverage = (percent: number | null): string | null => {
  if (percent == null) return null;
  const abs = Math.abs(Math.round(percent));
  if (percent > 0) return `${abs}% above squad avg this week`;
  if (percent < 0) return `${abs}% below squad avg this week`;
  return 'Right at squad avg this week';
};

export const formatWeeklyExamLine = (
  taken: number,
  total: number,
  streakWeeks: number
): string => {
  const base = `${taken} of ${total} study weeks`;
  if (streakWeeks > 0) return `${base} · ${streakWeeks} in a row`;
  return base;
};

export const formatTopCourseSubtitle = (
  course: ProfileInsights['learning']['top_course']
): string => {
  if (!course) return 'Finish a practice round to see your main course';
  return `${course.share_percent}% of your reps · ${course.title}`;
};

export const formatStrongestTopicSubtitle = (
  topic: ProfileInsights['learning']['strongest_topic']
): string => {
  if (!topic) return 'Practice more to unlock your strongest topic';
  return `${topic.accuracy_percent}% accuracy · ${topic.title}`;
};

export const formatSquadHighlights = (
  highlights: ProfileInsights['competitive']['squad_highlights']
): string => {
  const { top_three_count, squads_count } = highlights;
  if (squads_count === 0) return 'Join a squad to see highlights';
  if (top_three_count === 0) return `In ${squads_count} squad${squads_count === 1 ? '' : 's'} — climb the board`;
  return `Top 3 in ${top_three_count} of ${squads_count} squad${squads_count === 1 ? '' : 's'}`;
};

export const formatWeeklyExamVsAvg = (
  score: number | null,
  avg: number | null
): string | null => {
  if (score == null) return null;
  if (avg == null) return `Best week: ${score.toLocaleString()}`;
  return `Best week: ${score.toLocaleString()} · avg ${avg.toLocaleString()}`;
};

export const formatMultiplayerRecord = (wins: number, losses: number): string =>
  `${wins}W – ${losses}L`;
