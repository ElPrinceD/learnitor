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

**`POST /api/leaderboards/custom/create`** — now accepts `scoringMode`:

```json
{ "name": "My Squad", "scoringMode": "all_points" }
```

**`scoringMode`:** `"all_points"` | `"exam_only"` | `"custom_1v1"`

---

## 15. Custom 1v1 Matches

**`GET /api/h2h/custom/{squadId}/matches`**

**Response (200 OK):**
```json
[{ "id": "ch1", "player1": "You", "player2": "Jordan Lee", "score1": 134, "score2": 60, "result": "w", "round": 2 }]
```

---

## 16. Custom 1v1 Standings

**`GET /api/h2h/custom/{squadId}/standings`**

**Response (200 OK):**
```json
[{ "rank": 1, "name": "You", "pts": 9, "w": 3, "d": 0, "l": 0, "totalScore": 412, "weekScore": 134, "tiebreaker": null }]
```

**Tiebreaker Order:** Pts → Total Score → 1v1 record → Virtual coin toss (🪙 COIN badge)

---

## Existing Endpoints (Already Working)

These endpoints already exist and are used by the game system:

- `POST /games/` — Create a new game
- `POST /games/join/` — Join a game by code
- `GET /games/{id}/` — Get game details (questions, duration, etc.)
- Practice answers endpoint for fetching question answers
