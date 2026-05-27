import type { UserInfo } from "../store/authStore";

export type LeaderboardSetupVariant = "school" | "country";

export type LeaderboardSetupBlock = LeaderboardSetupVariant | null;

type ProfileUser = UserInfo["user"] | undefined | null;

const SEGMENT_BOARD_IDS = new Set(["world", "country", "school"]);

export const normalizeBoardId = (
  boardId: string | string[] | undefined
): string | undefined => {
  const raw = Array.isArray(boardId) ? boardId[0] : boardId;
  return raw?.toLowerCase();
};

export const getCurrentInstitutionId = (user: ProfileUser): number | null => {
  const id = user?.institution ?? user?.institution_id;
  if (typeof id !== "number" || !Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
};

export const hasSchoolProfile = (user: ProfileUser): boolean =>
  getCurrentInstitutionId(user) != null;

export const hasCountryProfile = (user: ProfileUser): boolean => {
  const country = user?.address?.country?.trim();
  return !!country;
};

/**
 * Returns which setup gate to show for segment leaderboards, or null if ready.
 */
export const getLeaderboardSetupBlock = (
  boardId: string | string[] | undefined,
  user: ProfileUser
): LeaderboardSetupBlock => {
  const id = normalizeBoardId(boardId);
  if (!id || !SEGMENT_BOARD_IDS.has(id)) {
    return null;
  }

  if (id === "school") {
    return hasSchoolProfile(user) ? null : "school";
  }

  if (id === "country") {
    if (!hasSchoolProfile(user)) {
      return "school";
    }
    return hasCountryProfile(user) ? null : "country";
  }

  return null;
};

export const LEADERBOARD_SETUP_COPY: Record<
  LeaderboardSetupVariant,
  { title: string; body: string; cta: string }
> = {
  school: {
    title: "Set up your school",
    body: "Choose your school to join your campus leaderboard and compete with students at your institution.",
    cta: "Set up school",
  },
  country: {
    title: "Unlock country rankings",
    body: "Choose your school to unlock country rankings. We use your school’s country for your regional board.",
    cta: "Set up school",
  },
};
