import type {
  CustomH2HMatchItem,
  CustomH2HStanding,
} from "../services/LeaderboardApiCalls";

type RawRecord = Record<string, unknown>;

export const AVERAGE_LABEL = "Average";

const toNullableNumber = (value: unknown): number | null => {
  if (value == null) {
    return null;
  }
  const parsed = toNumber(value, NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPlayerLabel = (value: unknown): string => {
  if (value == null) {
    return AVERAGE_LABEL;
  }
  const label = String(value).trim();
  return label || AVERAGE_LABEL;
};

export const normalizeCustomH2HMatch = (raw: RawRecord): CustomH2HMatchItem => ({
  id: String(raw.id ?? raw.match_id ?? ""),
  player1: toPlayerLabel(raw.player1 ?? raw.player_1),
  player2: toPlayerLabel(raw.player2 ?? raw.player_2),
  score1: toNullableNumber(raw.score1 ?? raw.score_1),
  score2: toNullableNumber(raw.score2 ?? raw.score_2),
  result: (raw.result ?? raw.status ?? "pending") as CustomH2HMatchItem["result"],
  round: raw.round != null ? toNumber(raw.round) : undefined,
});

export const isAverageOpponent = (label: string | null | undefined): boolean => {
  if (label == null) {
    return true;
  }
  const normalized = label.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "average" ||
    normalized.includes("average")
  );
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const resolveStandingName = (raw: RawRecord): string => {
  const candidates = [
    raw.name,
    raw.username,
    raw.player,
    raw.displayName,
    raw.display_name,
    raw.player_name,
    raw.playerName,
    raw.full_name,
    raw.fullName,
  ];

  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return "";
};

const detectAverageStanding = (raw: RawRecord, name: string): boolean => {
  const type = String(
    raw.type ?? raw.participant_type ?? raw.participantType ?? ""
  ).toLowerCase();
  const id = String(raw.id ?? raw.user_id ?? raw.userId ?? "").toLowerCase();
  const slug = String(raw.slug ?? raw.key ?? "").toLowerCase();

  return (
    raw.isAverage === true ||
    raw.is_average === true ||
    raw.isSynthetic === true ||
    raw.is_synthetic === true ||
    raw.synthetic === true ||
    type === "average" ||
    id === "average" ||
    slug === "average" ||
    isAverageOpponent(name)
  );
};

export const normalizeCustomH2HStanding = (raw: RawRecord): CustomH2HStanding => {
  let name = resolveStandingName(raw);
  const isAverage = detectAverageStanding(raw, name);

  if (isAverage && !name) {
    name = AVERAGE_LABEL;
  }

  return {
    rank: toNumber(raw.rank),
    name,
    pts: toNumber(raw.pts ?? raw.points ?? raw.PTS),
    w: toNumber(raw.w ?? raw.wins ?? raw.W),
    d: toNumber(raw.d ?? raw.draws ?? raw.D),
    l: toNumber(raw.l ?? raw.losses ?? raw.L),
    totalScore: toNumber(raw.totalScore ?? raw.total_score),
    weekScore: toNumber(raw.weekScore ?? raw.week_score),
    tiebreaker: raw.tiebreaker as CustomH2HStanding["tiebreaker"],
    isUser:
      raw.isUser === true ||
      raw.is_user === true ||
      raw.isMe === true ||
      raw.is_me === true,
    isAverage,
  };
};

const AVERAGE_PAYLOAD_KEYS = [
  "average",
  "averageRow",
  "average_row",
  "averageStanding",
  "average_standing",
  "syntheticAverage",
  "synthetic_average",
] as const;

const STANDINGS_ARRAY_KEYS = [
  "standings",
  "results",
  "data",
  "items",
  "rows",
  "entries",
  "leaderboard",
  "players",
] as const;

const extractStandingsArrays = (payload: unknown): RawRecord[][] => {
  const arrays: RawRecord[][] = [];

  const pushArray = (value: unknown) => {
    if (!Array.isArray(value)) {
      return;
    }
    arrays.push(value as RawRecord[]);
  };

  if (Array.isArray(payload)) {
    pushArray(payload);
    return arrays;
  }

  if (!payload || typeof payload !== "object") {
    return arrays;
  }

  const record = payload as RawRecord;
  for (const key of STANDINGS_ARRAY_KEYS) {
    pushArray(record[key]);
  }

  return arrays;
};

const extractAveragePayloads = (payload: unknown): RawRecord[] => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const record = payload as RawRecord;
  const extras: RawRecord[] = [];

  for (const key of AVERAGE_PAYLOAD_KEYS) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      extras.push({
        ...(value as RawRecord),
        name:
          (value as RawRecord).name ??
          (value as RawRecord).username ??
          AVERAGE_LABEL,
        is_average: true,
      });
    }
  }

  return extras;
};

export const parseCustomH2HStandingsResponse = (
  payload: unknown
): CustomH2HStanding[] => {
  const rows: CustomH2HStanding[] = [];
  const seen = new Set<string>();

  const addRow = (raw: RawRecord) => {
    const standing = normalizeCustomH2HStanding(raw);
    const key = standing.isAverage
      ? "__average__"
      : `${standing.rank}:${standing.name.toLowerCase()}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    rows.push(standing);
  };

  for (const array of extractStandingsArrays(payload)) {
    for (const item of array) {
      addRow(item);
    }
  }

  for (const extra of extractAveragePayloads(payload)) {
    addRow(extra);
  }

  return rows.sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (a.isAverage && !b.isAverage) {
      return 1;
    }
    if (!a.isAverage && b.isAverage) {
      return -1;
    }
    return a.name.localeCompare(b.name);
  });
};

const invertResult = (
  result: CustomH2HMatchItem["result"]
): CustomH2HMatchItem["result"] => {
  switch (result) {
    case "w":
      return "l";
    case "l":
      return "w";
    case "d":
      return "d";
    default:
      return "pending";
  }
};

const accumulateResult = (
  stats: { w: number; d: number; l: number; pts: number },
  result: CustomH2HMatchItem["result"]
) => {
  if (result === "w") {
    stats.w += 1;
    stats.pts += 3;
  } else if (result === "d") {
    stats.d += 1;
    stats.pts += 1;
  } else if (result === "l") {
    stats.l += 1;
  }
};

/**
 * If the API omits the synthetic Average row, derive one from vs-Average matches
 * or append a placeholder for odd-sized squads so the UI always lists Average.
 */
export const ensureAverageInStandings = (
  standings: CustomH2HStanding[],
  matches: CustomH2HMatchItem[]
): CustomH2HStanding[] => {
  const normalized = standings.map((row) => {
    if (row.isAverage || isAverageOpponent(row.name)) {
      return {
        ...row,
        name: row.name.trim() || AVERAGE_LABEL,
        isAverage: true,
      };
    }
    return row;
  });

  const hasAverageRow = normalized.some(
    (row) => row.isAverage || isAverageOpponent(row.name)
  );
  if (hasAverageRow) {
    return normalized;
  }

  const vsAverageMatches = matches.filter(
    (match) =>
      isAverageOpponent(match.player1) || isAverageOpponent(match.player2)
  );

  const humanCount = normalized.filter(
    (row) => !row.isAverage && !isAverageOpponent(row.name)
  ).length;

  const needsAverageRow =
    vsAverageMatches.length > 0 || humanCount % 2 === 1;

  if (!needsAverageRow) {
    return normalized;
  }

  const stats = { w: 0, d: 0, l: 0, pts: 0 };
  let totalScore = 0;
  let weekScore = 0;
  let scoredMatches = 0;

  for (const match of vsAverageMatches) {
    const averageIsPlayer1 = isAverageOpponent(match.player1);
    const averageScore = averageIsPlayer1 ? match.score1 : match.score2;
    if (averageScore != null) {
      totalScore += averageScore;
      weekScore += averageScore;
      scoredMatches += 1;
    }
    accumulateResult(stats, invertResult(match.result));
  }

  const maxRank = normalized.reduce(
    (max, row) => Math.max(max, row.rank),
    0
  );

  const averageRow: CustomH2HStanding = {
    rank: maxRank > 0 ? maxRank + 1 : normalized.length + 1,
    name: AVERAGE_LABEL,
    pts: stats.pts,
    w: stats.w,
    d: stats.d,
    l: stats.l,
    totalScore: scoredMatches > 0 ? totalScore : 0,
    weekScore: scoredMatches > 0 ? weekScore : 0,
    isAverage: true,
  };

  return [...normalized, averageRow].sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (a.isAverage && !b.isAverage) {
      return 1;
    }
    if (!a.isAverage && b.isAverage) {
      return -1;
    }
    return a.name.localeCompare(b.name);
  });
};
