// Shared types used across the play tab components.
//
// `ExamButtonState` is derived in `Mock/app/(tabs)/(play)/play.tsx` from the
// backend's weekly exam window plus a 60s tick, then passed down to both
// `ScoreCardHero` (for the deadline copy) and `ExamActionRow` (for the
// button label/icon).

export type ExamButtonState =
  | "hidden"
  | "teaser"
  | "active"
  | "completed"
  | "expired";

export type PlayMode = "rankings" | "h2h";

export type H2HTab = "matches" | "standings";

export type ScoringMode = "all_points" | "exam_only" | "custom_1v1";

export type SheetTab = "create" | "join";
