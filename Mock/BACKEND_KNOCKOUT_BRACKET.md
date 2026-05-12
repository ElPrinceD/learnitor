# Backend updates — Knockout bracket (per-squad)

**Audience:** backend dev.
**Status:** new request. Frontend is already wired and shipped; the endpoint just needs to start returning real data (and the URL needs to change as described below).
**Companion docs:** [BACKEND_RANKING_UPDATES.md](BACKEND_RANKING_UPDATES.md), [BACKEND_ENDPOINTS_REQUIRED.md](BACKEND_ENDPOINTS_REQUIRED.md).

---

## TL;DR

1. Change `GET /api/knockout/bracket` → `GET /api/leaderboards/custom/{id}/knockout-bracket`. The bracket is per-squad, not global; the current URL has no way to disambiguate which squad's bracket the caller wants.
2. The response shape stays the same as [Section 13](BACKEND_ENDPOINTS_REQUIRED.md) of the canonical doc — `{ rounds, totalRounds, currentRound }`. Don't change `KnockoutBracketResponse` / `KnockoutRound` / `KnockoutMatch`.
3. Only return data for non-knockout squads (`scoringMode === "all_points" | "exam_only"`). Knockout squads (`custom_1v1`) already have their own H2H Matches/Standings panel and don't need this endpoint.
4. Pre-bracket / pre-season → return `rounds: []` (the frontend renders an empty-state trophy + the "KNOCKOUT STARTS IN SW X" copy from `squadInfo`).

---

## Why this changed

The frontend used to import `getKnockoutBracket(token)` (no squad ID) but never called it — `knockoutBracketRounds` was hardcoded to `[]`. As part of the recent LeaderboardDetail refactor:

- The Rankings / Knockout outer tab pill was restored for non-knockout squads.
- The Knockout sub-tab now wires up a real `useQuery` to fetch the bracket.
- Because each non-knockout squad shows its **own** Knockout bracket (the rounds are derived from that squad's member count and `knockoutStartWeek`), the endpoint must be squad-scoped.

A global `/api/knockout/bracket` URL would return the same data for every squad the user opens, which is wrong.

---

## Endpoint spec

### `GET /api/leaderboards/custom/{id}/knockout-bracket`

**Auth:** `Authorization: Token <token>` (same as every other `/api/leaderboards/custom/*` endpoint).

**Path params:**

| Param | Type     | Notes                                                       |
| ----- | -------- | ----------------------------------------------------------- |
| `id`  | `string` | The custom squad ID, same one used by `GET /api/leaderboards/details/{id}`. |

**Response (200 OK):**

```json
{
  "rounds": [
    {
      "round": 1,
      "matches": [
        {
          "player1": "You",
          "player2": "Chen_L",
          "score1": 134,
          "score2": 40,
          "winner": "player1"
        },
        {
          "player1": "Sarah_M",
          "player2": "Average",
          "score1": null,
          "score2": null
        }
      ]
    },
    {
      "round": 2,
      "matches": [
        {
          "player1": "You",
          "player2": null,
          "score1": null,
          "score2": null
        }
      ]
    }
  ],
  "totalRounds": 4,
  "currentRound": 2
}
```

**Field reference:**

| Field          | Type                | Notes                                                                                              |
| -------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `rounds`       | `KnockoutRound[]`   | Ordered earliest-first. Each round contains its matches. Empty array if knockout hasn't started.   |
| `totalRounds`  | `number`            | `Math.ceil(Math.log2(memberCount))`. Matches `squadInfo.totalKnockoutRounds`.                      |
| `currentRound` | `number`            | 1-indexed round number currently being played. `1` before knockout starts.                        |

**`KnockoutMatch` shape:**

| Field    | Type                                  | Notes                                                                                |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `player1` | `string`                             | Username. Use `"You"` for the requesting user, the literal username for everyone else. Use `"Average"` for the FPL-style virtual participant in odd-member brackets (see canonical doc Section 13). |
| `player2` | `string`                             | Same rules as `player1`.                                                              |
| `score1`  | `number \| null`                     | Match score for player1. `null` while the round is still in progress (not yet played). |
| `score2`  | `number \| null`                     | Match score for player2. `null` while the round is still in progress.                  |
| `winner`  | `"player1" \| "player2"` (optional)  | Only set once the round is decided. Omit / `undefined` for in-progress matches.       |

> The `KnockoutMatch` / `KnockoutRound` / `KnockoutBracketResponse` TypeScript interfaces in [Mock/services/LeaderboardApiCalls.ts](services/LeaderboardApiCalls.ts) lines 92–109 already match this shape. **Do not break them.**

---

## Semantics

| Squad state                                                              | Response                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------------- |
| `scoringMode === "custom_1v1"` (knockout / H2H squad)                     | `404` or `409` — this endpoint is not for H2H squads. The frontend never calls it for these. |
| Non-knockout squad, knockout hasn't started yet (`currentWeek < knockoutStartWeek`) | `200` with `rounds: []`, `totalRounds: N`, `currentRound: 1`. |
| Non-knockout squad, knockout in progress                                  | `200` with populated `rounds` up to (and including) `currentRound`. Future rounds may be empty arrays or omitted from `rounds`. |
| Non-knockout squad, knockout finished                                     | `200` with all rounds populated, `currentRound === totalRounds`, final round's `winner` set. |

**Rules:**

- `winner` MUST be unset for in-progress matches (when `score1`/`score2` are still `null`). Don't pre-fill a guess; the frontend uses the absence of `winner` as the "in progress" signal.
- The first time the bracket is generated (week == `knockoutStartWeek`), seed player1/player2 according to the qualifying week's score ladder. Top performer faces the lowest, runner-up faces the second-lowest, etc. (Standard single-elimination seeding.)
- Odd-numbered squads use a virtual `"Average"` participant whose score for each round equals the global average across all users that Study Week (matches the canonical doc Section 13 description).
- BYEs (unbalanced brackets) → render as a match where the BYE recipient's `player2` is `null` and both scores are `null`. The frontend renders `null` players with an em-dash.

---

## Caching / invalidation hints

- The bracket only changes once per Study Week (when scores resolve at week rollover). It is safe to cache aggressively on the server. The frontend caches via React Query with the `["knockoutBracket", squadId]` key.
- Recommended TTL: invalidate at the Study Week rollover boundary (Friday 7pm UTC, same boundary as the weekly exam window — see [BACKEND_ENDPOINTS_REQUIRED.md Section 9](BACKEND_ENDPOINTS_REQUIRED.md)).

---

## What the frontend currently does

- File: [Mock/app/(game)/LeaderboardDetail.tsx](app/(game)/LeaderboardDetail.tsx)
- The query is gated to fire **only** when the user is on the Knockout sub-tab AND the squad is non-knockout: `enabled: !!userToken?.token && !isKnockout && activeTab === "knockout"`.
- React Query key: `["knockoutBracket", id]` — should become `["knockoutBracket", id]` once we add the squad ID to the cache key (today it's just `["knockoutBracket"]` because the URL was global). **Backend dev:** when this endpoint ships, ping the frontend to update the cache key.
- File: [Mock/services/LeaderboardApiCalls.ts](services/LeaderboardApiCalls.ts) lines 197–202 — `getKnockoutBracket` signature changes from `(token)` to `(squadId, token)`. The mobile side handles this in the same PR that consumes the new endpoint.

---

## Add `userRank` to the custom squad list

Extension to `GET /api/leaderboards/custom`. Each item in the response gains one new field so the Play tab can show the requesting user's rank on every squad card without making a per-squad detail call.

### Updated item shape

```json
{
  "id": "ck123",
  "name": "Saturday Striders",
  "memberCount": 17,
  "scoringMode": "all_points",
  "invite_code": "ABC123",
  "isCodePublic": true,
  "isCreator": false,
  "userRank": 4
}
```

### Semantics for `userRank`

| Squad state                                                                                    | Value to return | Frontend display intent                       |
| ---------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------- |
| User has a current rank in this squad's ladder                                                  | actual rank (1-based integer) | Render as `#4` with a minus indicator         |
| User is a member but unranked (e.g. brand-new squad, no scores yet, or pre-season)              | `null`          | Render as `—`                                  |
| Squad's current Study Week / H2H matchup has not started yet                                    | `null`          | Render as `—`                                  |

### Rank source per scoring mode

The rank must come from the **same ladder** the user lands on when they tap the squad card and open `GET /api/leaderboards/details/{id}`. Concretely:

- **`all_points`** → score-ordered ladder (same source as the existing `userStatus.rank` returned by the details endpoint). Use lifetime / season-cumulative score, depending on the timeframe the details endpoint currently uses for that squad.
- **`exam_only`** → score-ordered ladder restricted to weekly-exam submissions only (same source as `userStatus.rank` for an `exam_only` squad). Same selection rule the details endpoint already uses.
- **`custom_1v1`** → pts-ordered standings ladder, i.e. the same ranking returned by `GET /api/h2h/custom/{squadId}/standings`. The user's `rank` field on that response is the source of truth.

In every case `userRank` MUST equal the user's `rank` field on the matching detail / standings response. If those two values can ever diverge, it's a backend bug.

### Important rules for the backend dev

- `userRank` is per-requesting-user. It is not the same value for every caller — each user gets their own rank slotted into the response.
- This field is added to every item in `GET /api/leaderboards/custom` regardless of scoring mode; the **source** changes per mode (see above), the field name does not.
- Returning `null` is mandatory when the user is unranked. Do not return `0`, `-1`, or omit the field — the frontend distinguishes "unranked" (`null`) from "ranked #0" / "ranked #1" by exactly this signal.
- No new endpoints are required. This is a pure extension to the existing list response. No additional query params, no auth changes, no pagination changes.
- No mobile changes are required for the field to be safely added — the TypeScript interface `CustomLeaderboard` in `Mock/services/LeaderboardApiCalls.ts` already declares `userRank?: number | null` (frontend will start rendering it as soon as the backend ships).


## QA checklist

- Open a `all_points` squad with 8 members during week 1 (pre-knockout) → frontend shows the empty-state trophy + "KNOCKOUT STARTS IN SW X" copy.
- Same squad, week `knockoutStartWeek` → frontend shows round 1 with seeded matchups, both scores `null`, no `winner`.
- Same squad, mid-knockout → frontend shows played rounds with `winner` set and the current round with `null` scores.
- Same squad, after season end → frontend shows all rounds populated, final round has a `winner`.
- 7-member squad (odd) → one match in round 1 has `"Average"` as `player2`.
- 6-member squad (not a power of 2) → 2 players get BYEs in round 1 (rendered as matches with `player2: null`).
- Call the endpoint on a `custom_1v1` squad → expect `404` / `409`; frontend won't call it but the contract should still be enforced.

---

## Out of scope

- Returning bracket history for past seasons (only the current season's bracket is requested).
- Mutations to the bracket (seeding, manual overrides, etc.). The frontend is read-only here.
- Changes to the canonical Section 13 of [BACKEND_ENDPOINTS_REQUIRED.md](BACKEND_ENDPOINTS_REQUIRED.md). This document supersedes Section 13's URL; the canonical doc will be updated in the next doc-cleanup pass.
- The H2H Matches / Standings endpoints — already specified in [BACKEND_ENDPOINTS_REQUIRED.md Section 16](BACKEND_ENDPOINTS_REQUIRED.md), already consumed by the frontend, no changes needed.
- The `userRank` field on `GET /api/leaderboards/custom` — already specified in [BACKEND_RANKING_UPDATES.md Section 4](BACKEND_RANKING_UPDATES.md).
