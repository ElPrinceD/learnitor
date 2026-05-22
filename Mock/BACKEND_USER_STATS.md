# User Stats & Profile Insights — Backend Handoff

**Audience:** Backend developer  
**Frontend consumer:** Profile tab (`Mock/app/(tabs)/(account)/four.tsx`)  
**Future consumer:** Spotify Wrapped–style seasonal recap (not built in the app yet, but storage must support it)

---

## Why this document exists

The mobile app needs a single read endpoint for rich profile stats and **durable per-user storage** so we can later generate Wrapped-style recaps without recomputing history from raw game tables.

**Do not edit** [BACKEND_ENDPOINTS_REQUIRED.md](BACKEND_ENDPOINTS_REQUIRED.md). Cross-reference it for leaderboard/season context. Game score writes are defined in [BACKEND_RANKING_UPDATES.md](BACKEND_RANKING_UPDATES.md).

**Profile UI calls:** `GET /api/user/profile-insights` (this doc).  
**Legacy endpoint** `GET /api/user/stats` may remain; the new endpoint includes those fields under `legacy`.

---

## Design principles

1. **Store, don’t only compute at read time.** Every metric below must be recoverable from persisted rows (`UserStatsEvent` + aggregates), not ephemeral joins.
2. **Never delete `UserStatsEvent` rows.** Wrapped will replay events by season/year.
3. **Hook existing write paths** — do not require the app to call a separate “stats update” for games/exams if the main submit already succeeded.
4. **Idempotency** — duplicate game/exam submits must not double-count questions or wins (reuse existing `(gameId, userId, gameMode)` keys).
5. **User timezone** — daily streaks and “typical study time” use the user’s profile timezone (or device-reported TZ on submit); document the fallback (UTC).

---

## Data model

### `UserStatsAggregate` (one row per `user_id`)

Rolling counters and personal bests. Update synchronously on each qualifying write (or via nightly rollup from events — must be consistent within seconds for profile read).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | FK | PK |
| `member_since` | datetime | Copy from `User.date_joined` on first aggregate touch |
| `questions_answered_all_time` | int | Practice + game questions + weekly exam questions |
| `current_daily_streak` | int | Consecutive calendar days with activity ending today |
| `best_daily_streak_ever` | int | Max ever |
| `active_days_this_season` | int | Distinct dates with activity in current season |
| `season_total_days` | int | Days elapsed in current season (for “18 / 30” UI) |
| `most_active_day_of_week` | string | e.g. `"Tuesday"` — mode of weekday from activity |
| `typical_study_hour_start` | int | 0–23, user-local |
| `typical_study_hour_end` | int | exclusive end hour for label “8–10 PM” |
| `best_single_game_score` | int | Max `finalScore` from `single_player` or `multiplayer` |
| `best_session_streak` | int | Max `highestStreak` ever |
| `best_weekly_exam_score` | int | |
| `best_weekly_exam_global_average` | int | `global_average` stored at time of that best score |
| `world_rank_jump_this_season` | int nullable | See rank snapshot section |
| `games_single_player` | int | Count of completed single-player sessions |
| `games_multiplayer` | int | Count of completed multiplayer sessions |
| `multiplayer_wins` | int | User had strictly highest score among participants |
| `multiplayer_losses` | int | User participated but did not win (ties = not a win unless sole top) |
| `weekly_exams_taken` | int | Current season |
| `weekly_exam_streak_weeks` | int | Consecutive study weeks with a submission |
| `practice_questions_by_course` | JSON | `{ course_id: count }` for top course % |
| `practice_accuracy_by_topic` | JSON | `{ topic_id: { correct, total } }` for strongest topic |
| `accuracy` | float | Legacy: % correct all-time |
| `sessions` | int | Legacy: total game sessions |
| `streak_avg` | float | Legacy: avg in-session streak |
| `streak_avg_delta` | float | Legacy: vs prior 30d |
| `tier` | string | Legacy label |

### `UserDailyActivity`

| Column | Type |
|--------|------|
| `user_id` | FK |
| `date` | date (user-local) |
| PK | (`user_id`, `date`) |

Insert on any qualifying activity (ignore duplicate same day).

### `UserStatsEvent` (append-only — Wrapped source of truth)

| Column | Type |
|--------|------|
| `id` | bigint PK |
| `user_id` | FK |
| `event_type` | string enum |
| `payload` | JSON |
| `occurred_at` | datetime |
| `season_id` | FK nullable |

**`event_type` values:**

- `practice_session_complete`
- `game_result_submit` — payload: `{ game_id, game_mode, final_score, highest_streak, questions_count, won? }`
- `weekly_exam_submit` — payload: `{ week, score, global_average }`
- `topic_mark_completed` — payload: `{ course_id, topic_id }`
- `rank_snapshot` — payload: `{ world_rank, season_id, week }`

### `UserRankSnapshot`

| Column | Type |
|--------|------|
| `user_id` | FK |
| `season_id` | FK |
| `study_week` | int |
| `world_rank` | int nullable |
| `recorded_at` | datetime |

**Schedule:** After each successful `POST /api/games/results/submit` that updates global totals, store current world rank.  
**`world_rank_jump_this_season`:** `first_snapshot_rank - current_rank` (positive = climbed). If user had no rank at season start, use first non-null snapshot in season as baseline. Return `0` if no change yet; `null` if never ranked.

### `UserPracticeSession`

| Column | Type |
|--------|------|
| `user_id` | FK |
| `topic_id` | int |
| `course_id` | int |
| `level` | string |
| `questions_count` | int |
| `correct_count` | int |
| `duration_seconds` | int nullable |
| `completed_at` | datetime |

### `UserWeeklyExamLog`

| Column | Type |
|--------|------|
| `user_id` | FK |
| `season_id` | FK |
| `study_week` | int |
| `score` | int |
| `global_average_at_submit` | int |
| `submitted_at` | datetime |

Unique: (`user_id`, `season_id`, `study_week`).

### `UserSquadInsight` (optional cache, refresh on exam submit / squad rank change)

| Column | Type |
|--------|------|
| `user_id` | FK |
| `squad_id` | FK |
| `season_id` | FK |
| `user_rank` | int nullable |
| `squad_weekly_exam_avg` | float nullable |
| `updated_at` | datetime |

---

## Write paths (must update stats pipeline)

### 1. `POST /api/games/results/submit` (existing)

On successful 200 (inside same transaction as ranking updates):

1. Resolve `questions_count` for that game (question list length).
2. `questions_answered_all_time += questions_count`
3. Increment `games_single_player` or `games_multiplayer` by `game_mode`.
4. Multiplayer: load all participant scores for `gameId`; if requester has **strictly** highest score → `multiplayer_wins++`, else `multiplayer_losses++` (ties: win only if sole top scorer).
5. `best_single_game_score = max(best, finalScore)`
6. If `highestStreak` provided: `best_session_streak = max(best, highestStreak)`; update rolling `streak_avg` / `streak_avg_delta`.
7. Upsert `UserDailyActivity` for today; recompute `current_daily_streak`, `best_daily_streak_ever`, `active_days_this_season`.
8. Append `UserStatsEvent` `game_result_submit`.
9. Record `UserRankSnapshot` for current study week.
10. Recompute `most_active_day_of_week` and typical study hour from last N sessions (or increment histogram).

See [BACKEND_RANKING_UPDATES.md](BACKEND_RANKING_UPDATES.md) for ranking propagation.

### 2. `POST /api/weekly-exam/submit` (existing)

On successful 200:

1. Add exam question count to `questions_answered_all_time`.
2. Upsert `UserWeeklyExamLog`; increment `weekly_exams_taken` if new week.
3. Update `weekly_exam_streak_weeks` (consecutive weeks with submission).
4. Update `best_weekly_exam_score` and `best_weekly_exam_global_average` if new high.
5. Daily activity + streak fields + event `weekly_exam_submit`.
6. Refresh squad aggregates for `vs_squad_weekly_exam_percent` and `squad_highlights`.

`weekly_exams_total` in API response = study weeks elapsed in current season (max 13 per season system in BACKEND_ENDPOINTS_REQUIRED.md).

### 3. **NEW** `POST /api/learner/practice/session-complete`

Practice does not hit game submit today; the app will call this from the score screen after a practice round.

**Headers:** `Authorization: Token <token>`

**Request body:**

```json
{
  "topic_id": 12,
  "course_id": 3,
  "level": "Intermediate",
  "questions_count": 20,
  "correct_count": 16,
  "duration_seconds": 840
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `topic_id` | yes | |
| `course_id` | yes | |
| `level` | yes | `Beginner` \| `Intermediate` \| `Advanced` \| `Master` |
| `questions_count` | yes | ≥ 1 |
| `correct_count` | yes | 0..questions_count |
| `duration_seconds` | no | |

**Response 200:**

```json
{ "success": true }
```

**Actions:** Insert `UserPracticeSession`; increment `questions_answered_all_time`; merge into `practice_questions_by_course` and `practice_accuracy_by_topic`; daily activity + streaks; append `practice_session_complete` event. Idempotency optional: client may retry; use `(user_id, topic_id, completed_at minute)` dedupe if needed.

### 4. Topic mark-completed (existing)

`POST /api/learner/{userId}/course/{courseId}/topic/{topicId}/mark-completed/`

Also: daily activity, event `topic_mark_completed`, increment topic completion counters (for future Wrapped).

---

## Read endpoint

### `GET /api/user/profile-insights`

**Headers:** `Authorization: Token <token>`

**Response 200:**

```json
{
  "member_since": "2024-03-15T00:00:00Z",
  "habits": {
    "current_daily_streak": 12,
    "active_days_this_season": 18,
    "season_total_days": 30,
    "best_daily_streak_ever": 21,
    "most_active_day_of_week": "Tuesday",
    "typical_study_time": {
      "label": "8–10 PM",
      "hour_start": 20,
      "hour_end": 22
    }
  },
  "volume": {
    "questions_answered_all_time": 4820
  },
  "personal_bests": {
    "best_single_game_score": 1420,
    "best_session_streak": 11,
    "best_weekly_exam_score": 980,
    "best_weekly_exam_global_average": 840,
    "world_rank_jump_this_season": 47
  },
  "learning": {
    "top_course": {
      "id": 3,
      "title": "Biology",
      "share_percent": 64
    },
    "strongest_topic": {
      "id": 12,
      "title": "Cell Structure",
      "accuracy_percent": 92
    }
  },
  "competitive": {
    "games_single_player": 84,
    "games_multiplayer": 31,
    "multiplayer_wins": 19,
    "multiplayer_losses": 12,
    "weekly_exams_taken": 9,
    "weekly_exams_total": 12,
    "weekly_exam_streak_weeks": 4,
    "squad_highlights": {
      "top_three_count": 2,
      "squads_count": 2
    },
    "vs_squad_weekly_exam_percent": 12
  },
  "legacy": {
    "accuracy": 74.2,
    "sessions": 1204,
    "streak_avg": 4.82,
    "streak_avg_delta": 0.12,
    "tier": "Pro Tier"
  }
}
```

### Field computation rules

| Field | Rule |
|-------|------|
| `typical_study_time` | 2-hour bucket with highest session count from practice + game `occurred_at` (user-local). `label` human-readable. |
| `world_rank_jump_this_season` | Positive integer = ranks climbed worldwide this season. `0` = none yet. `null` = user never ranked. |
| `learning.top_course` | Course with highest share of practice `questions_count` this season (or all-time if season sparse). `share_percent` = round(100 * course / total). `null` if no practice. |
| `learning.strongest_topic` | Topic with highest `accuracy_percent` among topics with ≥ 10 practice questions. `null` if none. |
| `squad_highlights.top_three_count` | Number of custom squads where `userRank <= 3` this season (see custom leaderboard list API). |
| `squad_highlights.squads_count` | Squads counted in that scan (for “Top 3 in 2 squads” copy). |
| `vs_squad_weekly_exam_percent` | Across squads where user has current-week exam score: `round(100 * (user - avg) / avg)`. `null` if no squad exam data. |

**Nullable sections:** Return `null` for `top_course`, `strongest_topic`, or zero competitive stats when user is new — frontend shows empty states.

---

## Future: Wrapped recap (not required for first profile ship)

### `GET /api/user/wrapped-recap`

**Query:** `period=season|year`, `season_id` (optional)

Returns narrative blocks built from `UserStatsEvent` + aggregates (top week, biggest climb, accuracy delta, top 3 topics, etc.). **Do not delete events** when implementing this later.

Optional nightly job: rollup events → `UserStatsAggregate` (idempotent).

---

## Frontend write emitters (for integration testing)

| Screen | Write |
|--------|-------|
| `PracticeQuestions.tsx` → `ScorePage.tsx` | `POST /api/learner/practice/session-complete` |
| `Game.tsx` / solo submit | `POST /api/games/results/submit` (existing) |
| `WeeklyExam.tsx` | `POST /api/weekly-exam/submit` (existing) |
| `ScorePage.tsx` Done | topic mark-completed (existing) |

---

## Implementation checklist

- [ ] Migrations for all tables above
- [ ] `GET /api/user/profile-insights` returns shape above for authenticated user
- [ ] Hook `games/results/submit` → stats + event + rank snapshot
- [ ] Hook `weekly-exam/submit` → stats + exam log + squad cache
- [ ] Implement `practice/session-complete`
- [ ] Hook topic mark-completed → daily activity + event
- [ ] Seed `member_since` from user registration date
- [ ] Document TZ handling in code comments
- [ ] Verify idempotent game resubmit does not inflate counters

---

## Related docs

- [BACKEND_ENDPOINTS_REQUIRED.md](BACKEND_ENDPOINTS_REQUIRED.md) — leaderboards, seasons, `GET /api/user/stats`, season history
- [BACKEND_RANKING_UPDATES.md](BACKEND_RANKING_UPDATES.md) — universal game result submit
