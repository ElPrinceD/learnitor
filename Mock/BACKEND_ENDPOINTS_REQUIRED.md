# Backend Endpoints Required

This document lists all API endpoints needed for the game/leaderboard features. The frontend is already coded to call these endpoints. Once implemented, sync should be seamless.

---

## 1. Leaderboard Rankings Summary

**`GET /api/leaderboards/rankings/summary`**

Returns the authenticated user's current rank across all default leaderboard categories.

**Headers:**
- `Authorization: Token <user_token>`

**Response (200 OK):**
```json
{
  "world": "#12,842",
  "country": "#482",
  "school": "#3"
}
```

**Notes:**
- Ranks are formatted strings (e.g., `"#12,842"`)
- Return `null` for any category where the user has no score yet
- Rankings are based on accumulated single-player game scores

---

## 2. List Custom Leaderboards

**`GET /api/leaderboards/custom`**

Returns all custom leaderboard groups the authenticated user belongs to.

**Headers:**
- `Authorization: Token <user_token>`

**Query Params:**
- `timeframe` (optional): `"season"` | `"all_time"` — defaults to `"season"`

**Response (200 OK):**
```json
[
  {
    "id": "abc123",
    "name": "CS Study Group",
    "memberCount": 15,
    "icon": "people"
  }
]
```

---

## 3. Create Custom Leaderboard

**`POST /api/leaderboards/custom/create`**

Creates a new custom leaderboard group. The creator is automatically added as a member.

**Headers:**
- `Authorization: Token <user_token>`

**Request Body:**
```json
{
  "name": "My Study Squad"
}
```
*(name is optional — backend can auto-generate a name)*

**Response (201 Created):**
```json
{
  "id": "abc123",
  "name": "My Study Squad",
  "invite_code": "SQ4X9K"
}
```

---

## 4. Join Custom Leaderboard

**`POST /api/leaderboards/custom/join`**

Join an existing custom leaderboard using an invite code.

**Headers:**
- `Authorization: Token <user_token>`

**Request Body:**
```json
{
  "inviteCode": "SQ4X9K"
}
```

**Response (200 OK):**
```json
{
  "id": "abc123",
  "name": "CS Study Group"
}
```

**Error Responses:**
- `404` — Invalid invite code
- `409` — Already a member

---

## 5. Leaderboard Detail Rankings

**`GET /api/leaderboards/details/{id}`**

Returns the ranked list of users for a specific leaderboard.

**Headers:**
- `Authorization: Token <user_token>`

**Path Params:**
- `id`: Leaderboard ID (`"world"`, `"country"`, `"school"`, `"program"`, or a custom leaderboard UUID)

**Query Params:**
- `timeframe`: `"season"` | `"all_time"`

**Response (200 OK):**
```json
{
  "rankings": [
    {
      "id": 1,
      "rank": 1,
      "username": "Alex Johnson",
      "avatarUrl": "https://...",
      "score": 9850,
      "badge": "Top Scholar"
    },
    {
      "id": 2,
      "rank": 2,
      "username": "Sam Smith",
      "avatarUrl": null,
      "score": 8700,
      "badge": "Rising Star"
    }
  ],
  "userStatus": {
    "rank": 452,
    "percentile": "top 5%",
    "message": "Keep climbing, Learner!"
  }
}
```

**Notes:**
- For `"world"`, rank across all users globally
- For `"country"`, rank among users from the same country
- For `"school"`, rank among users from the same school/institution
- For custom IDs, rank among members of that group
- `badge` is an optional display label (e.g., "Top Scholar", "Rising Star", "Academic Elite")
- `userStatus` object conveys the requesting user's current position and a motivational message
- Include the requesting user's entry highlighted (the frontend checks `username` match)

---

## 6. Submit Single-Player Game Score

**`POST /api/games/single-player/submit`**

Submits the final score from a completed single-player game session.

**Headers:**
- `Authorization: Token <user_token>`

**Request Body:**
```json
{
  "gameId": "game-uuid-or-id",
  "finalScore": 1250,
  "highestStreak": 7
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "newTotalScore": 15800,
  "rankChanges": {
    "world": "#12,840",
    "country": "#480",
    "school": "#3"
  }
}
```

**Notes:**
- `finalScore` is the total points earned in this game session
- `highestStreak` is the longest consecutive correct answer streak
- Backend should accumulate scores for ranking calculations
- `rankChanges` is optional but useful for a post-game results screen

---

## 7. User Profile Stats

**`GET /api/user/stats`**

Returns the authenticated user's aggregated game statistics for the Profile page.

**Headers:**
- `Authorization: Token <user_token>`

**Response (200 OK):**
```json
{
  "accuracy": 74.2,
  "sessions": 1204,
  "streakAvg": 4.82,
  "streakAvgDelta": 0.12,
  "tier": "Pro Tier"
}
```

**Notes:**
- `accuracy` — percentage of correct answers across all sessions
- `sessions` — total number of game sessions completed
- `streakAvg` — average consecutive correct answers per session
- `streakAvgDelta` — change in streak average compared to previous period (positive = improvement)
- `tier` — user level label (e.g., "Learner", "Pro Tier", "Elite")

---

## 8. User Season History

**`GET /api/user/season-history`**

Returns the authenticated user's performance history across past seasons.

**Headers:**
- `Authorization: Token <user_token>`

**Response (200 OK):**
```json
[
  {
    "season_name": "Season 03",
    "final_score": 14290,
    "rank": 112,
    "maxScore": 17000
  },
  {
    "season_name": "Season 02",
    "final_score": 12105,
    "rank": 304,
    "maxScore": 17000
  }
]
```

**Notes:**
- Ordered by most recent season first
- `maxScore` is the theoretical maximum or highest score that season (used for progress bar calculation)
- `rank` is the user's final rank for that season

---

## Season System

The leaderboard uses a "season" system for time-based competition:

- **Current Season**: Scores accumulated within the current season period. Each season is exactly **13 Study Weeks** long (~3 months).
- **All-Time**: Lifetime accumulated scores.

The backend needs to:
1. Define the 13-week season duration boundary.
2. Reset season scores at the start of each new season.
3. Archive previous season results.
4. Support both `season` and `all_time` timeframe queries.

---

## 9. Weekly Exam Status

**`GET /api/weekly-exam/status`**

Returns the current exam window status and whether the user has already completed this week's exam.

**Headers:**
- `Authorization: Token <user_token>`

**Response (200 OK):**
```json
{
  "isActive": true,
  "hasCompleted": false,
  "startsAt": "2026-04-24T19:00:00Z",
  "endsAt": "2026-04-26T23:59:00Z",
  "currentWeek": 11,
  "globalAverage": 88,
  "userScore": null
}
```

**Notes:**
- Exam window: Friday 7pm UTC → Sunday 11:59pm UTC
- `hasCompleted` is per-user per-week
- `currentWeek` is the current Study Week out of 13
- `globalAverage` is the average score of all users globally for the current week
- `userScore` is the requesting user's score for the current week (returns `null` if not taken yet)

---

## 10. Weekly Exam Questions

**`GET /api/weekly-exam/questions`**

Returns 30 randomized questions from the 300-question pool.

**Headers:**
- `Authorization: Token <user_token>`

**Response (200 OK):**
```json
{
  "questions": [
    { "id": 9001, "content": "What is...", "level": "medium", "duration": 20 }
  ]
}
```

**Notes:**
- Returns exactly 30 questions
- Randomized per user, consistent within a session
- Only callable during active exam window if user hasn't completed

---

## 11. Submit Weekly Exam

**`POST /api/weekly-exam/submit`**

**Request Body:**
```json
{ "finalScore": 1340, "highestStreak": 8 }
```

**Response (200 OK):**
```json
{
  "success": true,
  "weeklyRank": 12,
  "h2hResult": { "opponentName": "Jordan Lee", "opponentScore": 60, "result": "won" }
}
```

---

## 12. 1v1 Battles Current Matchup

**`GET /api/h2h/current`**

Returns the user's current 1v1 Battles matchup in default leagues.

**Response (200 OK):**
```json
{
  "id": "h2h-1",
  "opponentName": "Jordan Lee",
  "opponentAvatar": null,
  "userScore": 134,
  "opponentScore": 60,
  "status": "won",
  "round": 2,
  "totalRounds": 4
}
```

**Notes:**
- `status`: `"pending"` | `"won"` | `"lost"` | `"draw"`
- Pairings assigned at Friday 7pm UTC
- Returns `null` if no active knockout

---

## 13. Knockout Bracket

**`GET /api/knockout/bracket`**

**Response (200 OK):**
```json
{
  "rounds": [
    { "round": 1, "matches": [{ "player1": "You", "player2": "Chen_L", "score1": 134, "score2": 40, "winner": "player1" }] }
  ],
  "totalRounds": 4,
  "currentRound": 2
}
```

**Notes:**
- Single elimination. Rounds are dynamically calculated by the backend based on the number of members in the squad (using `Math.ceil(Math.log2(memberCount))`).
- The knockout starts at `Season End Week (13) - Total Rounds + 1`.
- Odd squads: "Average" virtual participant (FPL-style, score = global average of all users that Study Week).
- Unbalanced brackets (not a perfect power of 2): Top performers from the qualifying week receive a BYE.

---

## 14. Create Custom Leaderboard (Updated)

**`POST /api/leaderboards/custom/create`** — now accepts `name` and `scoringMode`:

```json
{ "name": "My Squad", "scoringMode": "all_points" }
```

**Field Reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | User-defined squad name. Max 40 characters. Must not be empty. |
| `scoringMode` | `string` (enum) | Yes | Determines how squad rankings are calculated. See below. |

**`scoringMode` options:**

| Value | Label (UI) | Description |
|-------|-----------|-------------|
| `"all_points"` | 📊 All Points | All score sources count: multiplayer games, solo games, and weekly exam scores. |
| `"exam_only"` | 📝 Exam Only | Only weekly exam scores contribute to the leaderboard ranking. |
| `"custom_1v1"` | ⚔️ H2H League | Members are paired weekly for head-to-head matches. Win = 3 pts, Draw = 1 pt, Loss = 0 pts. Separate standings table. |

**Response (201 Created):**
```json
{
  "id": "abc123",
  "name": "My Squad",
  "invite_code": "SQ4X9K"
}
```

**`invite_code` format:**
- 6 alphanumeric uppercase characters (e.g. `"SQ4X9K"`)
- Must be unique across all squads
- Auto-generated by the backend on creation

---

## 15. Custom 1v1 Matches

**`GET /api/h2h/custom/{squadId}/matches`**

Returns all H2H match results for a custom_1v1 squad.

**Response (200 OK):**
```json
[{ "id": "ch1", "player1": "You", "player2": "Jordan Lee", "score1": 134, "score2": 60, "result": "w", "round": 2 }]
```

**Field Reference:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique match ID |
| `player1` | `string` | Display name of player 1 (use `"You"` for the requesting user) |
| `player2` | `string` | Display name of player 2 |
| `score1` | `number \| null` | Player 1's score. `null` if match not yet played. |
| `score2` | `number \| null` | Player 2's score. `null` if match not yet played. |
| `result` | `string` (enum) | Match result **from the requesting user's perspective**. See below. |
| `round` | `number \| null` | Round number (1-indexed). Optional. |

**`result` options:**

| Value | Meaning |
|-------|--------|
| `"w"` | Win — the requesting user won this match |
| `"d"` | Draw — both players had equal scores |
| `"l"` | Loss — the requesting user lost this match |
| `"pending"` | Not yet played — match is scheduled but scores are not in |

---

## 16. Custom 1v1 Standings

**`GET /api/h2h/custom/{squadId}/standings`**

**Response (200 OK):**
```json
[{ "rank": 1, "name": "You", "pts": 9, "w": 3, "d": 0, "l": 0, "totalScore": 412, "weekScore": 134, "tiebreaker": null }]
```

**Field Reference:**

| Field | Type | Description |
|-------|------|-------------|
| `rank` | `number` | Position in the standings (1-indexed) |
| `name` | `string` | Player display name (use `"You"` for requesting user) |
| `pts` | `number` | Total league points (Win=3, Draw=1, Loss=0) |
| `w` | `number` | Total wins |
| `d` | `number` | Total draws |
| `l` | `number` | Total losses |
| `totalScore` | `number` | Cumulative game score across all rounds |
| `weekScore` | `number` | Score for the current/latest study week |
| `tiebreaker` | `string \| null` | How a tie was broken. See below. |

**`tiebreaker` options:**

| Value | Meaning |
|-------|--------|
| `null` | No tiebreaker needed — player has a unique rank |
| `"standoff"` | Virtual coin toss — displayed as 🪙 COIN badge in the UI |

**Tiebreaker Resolution Order:**
1. Points (`pts`) — highest first
2. Total Score (`totalScore`) — highest first
3. Head-to-head record between tied players
4. Virtual coin toss (`tiebreaker: "standoff"`) — random, marked with badge

---

## Existing Endpoints (Already Working)

These endpoints already exist and are used by the game system:

- `POST /games/` — Create a new game
- `POST /games/join/` — Join a game by code
- `GET /games/{id}/` — Get game details (questions, duration, etc.)
- Practice answers endpoint for fetching question answers

---

## 17. Update Squad Details (NEW)

**`PUT /api/leaderboards/custom/{id}`**

Update name or code visibility settings for a custom leaderboard. Only the creator can perform this action. All fields in the request body are optional — include only the fields you want to update.

**Headers:**
- `Authorization: Token <user_token>`

**Request Body:**
```json
{
  "name": "New Squad Name",
  "isCodePublic": true
}
```

**Field Reference:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|------------|-------------|
| `name` | `string` | No | 1-40 characters, non-empty | New display name for the squad |
| `isCodePublic` | `boolean` | No | `true` or `false` | Controls who can see the invite code. See below. |

**`isCodePublic` options:**

| Value | Meaning |
|-------|--------|
| `false` (default) | Only the squad creator can view and share the invite code |
| `true` | All squad members can view and share the invite code |

**Response (200 OK):**
```json
{
  "id": "abc123",
  "name": "New Squad Name",
  "isCodePublic": true
}
```

**Error Responses:**
- `400` — Invalid data (empty name, name too long)
- `403` — Not the squad creator
- `404` — Squad not found

---

## 18. Regenerate Invite Code (NEW)

**`POST /api/leaderboards/custom/{id}/regenerate-code`**

Generates a new invite code, invalidating the old one. Only the creator can perform this action.

**Headers:**
- `Authorization: Token <user_token>`

**Response (200 OK):**
```json
{
  "invite_code": "NEW99X"
}
```

---

## 19. Remove a Member (NEW)

**`DELETE /api/leaderboards/custom/{id}/members/{userId}`**

Removes a member from the squad. Only the creator can perform this action. The creator cannot remove themselves.

**Headers:**
- `Authorization: Token <user_token>`

**Response (204 No Content)**

---

## 20. Delete Squad (NEW)

**`DELETE /api/leaderboards/custom/{id}`**

Permanently deletes a squad and removes all members. Only the creator can perform this action.

**Headers:**
- `Authorization: Token <user_token>`

**Response (204 No Content)**

---

## Updated Response Formats

### GET `/api/leaderboards/custom` — Updated Response

Each squad item should now include:

```json
{
  "id": "abc123",
  "name": "CS Study Group",
  "memberCount": 15,
  "icon": "people",
  "scoringMode": "all_points",
  "invite_code": "SQ4X9K",
  "isCodePublic": false,
  "isCreator": true
}
```

**Field Reference:**

| Field | Type | Always present | Description |
|-------|------|---------------|-------------|
| `id` | `string` | Yes | Unique squad identifier (UUID) |
| `name` | `string` | Yes | Squad display name (1-40 chars) |
| `memberCount` | `number` | Yes | Current number of members in the squad |
| `icon` | `string` | Yes | Icon identifier. Always `"people"` for now. |
| `scoringMode` | `string` (enum) | Yes | One of: `"all_points"`, `"exam_only"`, `"custom_1v1"`. See endpoint #14 for descriptions. |
| `invite_code` | `string \| null` | Conditional | 6-char alphanumeric code. **Only include if** `isCodePublic` is `true` OR the requesting user is the creator. Otherwise omit or return `null`. |
| `isCodePublic` | `boolean` | Yes | `false` = only creator sees code. `true` = all members see code. Default: `false`. |
| `isCreator` | `boolean` | Yes | `true` if the requesting user created this squad, `false` otherwise. |

### GET `/api/leaderboards/details/{id}` — Updated Response

For custom squad IDs, include a `squadInfo` object:

```json
{
  "rankings": [
    {
      "id": 1,
      "rank": 1,
      "username": "Alex Johnson",
      "avatarUrl": "https://...",
      "score": 9850,
      "badge": "Top Scholar",
      "movement": "up"
    }
  ],
  "userStatus": {
    "rank": 12,
    "percentile": "top 15%",
    "message": "Keep going!"
  },
  "squadInfo": {
    "knockoutStartWeek": 10,
    "knockoutStarted": false,
    "totalKnockoutRounds": 4,
    "invite_code": "SQ4X9K",
    "isCodePublic": false,
    "isCreator": true,
    "members": [
      { "id": 1, "username": "Alex", "avatarUrl": null },
      { "id": 2, "username": "Jordan", "avatarUrl": null }
    ]
  }
}
```

**`rankings[]` Field Reference:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | User ID |
| `rank` | `number` | Position in the leaderboard (1-indexed) |
| `username` | `string` | Display name |
| `avatarUrl` | `string \| null` | Profile picture URL. `null` if no avatar. |
| `score` | `number` | Total score based on the squad's `scoringMode` |
| `badge` | `string \| null` | Optional display label. Options: `"Top Scholar"`, `"Rising Star"`, `"Academic Elite"`, or `null` |
| `movement` | `string \| null` | Rank change indicator. Options: `"up"`, `"down"`, `"same"`, or `null` |

**`userStatus` Field Reference:**

| Field | Type | Description |
|-------|------|-------------|
| `rank` | `number \| null` | The requesting user's current rank. `null` if unranked. |
| `percentile` | `string \| null` | Human-readable percentile (e.g. `"top 5%"`, `"top 15%"`). |
| `message` | `string \| null` | Motivational message (e.g. `"Keep climbing!"`, `"You're on fire!"`) |

**`squadInfo` Field Reference (only present for custom squad IDs, omit for global leaderboards):**

| Field | Type | Description |
|-------|------|-------------|
| `knockoutStartWeek` | `number` | Study Week when knockout begins. Calculated as `13 - totalKnockoutRounds + 1`. |
| `knockoutStarted` | `boolean` | `true` if `currentWeek >= knockoutStartWeek`, `false` otherwise. |
| `totalKnockoutRounds` | `number` | Number of knockout rounds. Calculated as `Math.ceil(Math.log2(memberCount))`. |
| `invite_code` | `string \| null` | Squad invite code. Only include if `isCodePublic` is `true` OR requesting user is creator. |
| `isCodePublic` | `boolean` | Whether the invite code is visible to all members. |
| `isCreator` | `boolean` | Whether the requesting user is the squad creator. |
| `members` | `array` | Full list of squad members. See member fields below. |

**`members[]` Field Reference:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | User ID (used for the remove member endpoint) |
| `username` | `string` | Display name |
| `avatarUrl` | `string \| null` | Profile picture URL. `null` if no avatar. |

**Important Rules:**
- `knockoutStartWeek` = `13 - totalKnockoutRounds + 1`
- `totalKnockoutRounds` = `Math.ceil(Math.log2(memberCount))`
- `knockoutStarted` = `true` if `currentWeek >= knockoutStartWeek`
- The **authenticated user MUST appear in the `rankings` list** at their actual rank position. The frontend highlights their row with a special style.
- If the user is outside the top N, **still include them** appended at their actual rank — the frontend scrolls to and highlights them.

---

### GET `/api/weekly-exam/status` — Updated Response

Add `seasonName` field:

```json
{
  "isActive": true,
  "hasCompleted": false,
  "startsAt": "2026-05-08T19:00:00Z",
  "endsAt": "2026-05-10T23:59:00Z",
  "currentWeek": 11,
  "seasonName": "Season 04",
  "globalAverage": 88,
  "userScore": null
}
```

**Field Reference:**

| Field | Type | Description |
|-------|------|-------------|
| `isActive` | `boolean` | `true` if the exam window is currently open (between `startsAt` and `endsAt`) |
| `hasCompleted` | `boolean` | `true` if the requesting user has already submitted this week's exam |
| `startsAt` | `string` (ISO 8601) | UTC datetime when the exam window opens (typically Friday 7pm UTC) |
| `endsAt` | `string` (ISO 8601) | UTC datetime when the exam window closes (typically Sunday 11:59pm UTC) |
| `currentWeek` | `number` | Current study week number within the season (1-13) |
| `seasonName` | `string` | Display label for the current season (e.g. `"Season 04"`, `"Season 05"`) |
| `globalAverage` | `number \| null` | Average score of all users globally for the current week. `null` if no scores yet. |
| `userScore` | `number \| null` | The requesting user's exam score this week. `null` if not taken yet. |
