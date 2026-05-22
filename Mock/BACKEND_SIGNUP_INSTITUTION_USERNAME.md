# Backend Update: Signup School + Username

**Context:** The mobile signup screen (`ContinueWithEmail.tsx`) now requires a **school** and **username**. Date of birth is **no longer** collected at signup. This doc lists only what you need to add or change.

**Frontend already calls:** `GET /api/institutions/`, `GET /api/auth/username/check/`, and `POST /api/register/` with the shapes below.

---

## What’s new (summary)

| Item | Action |
|------|--------|
| `Institution` model | Add (or use existing) with `name`, `city`, **`country`** (ISO 3166-1 alpha-2), `is_active`, `is_featured` |
| User | Add `username` + `institution` FK; **set user country from institution** on register (see below) |
| `GET /api/institutions/` | **New** — featured list + search |
| `GET /api/auth/username/check/` | **New** — fast availability check |
| `POST /api/register/` | **Update** — require `username`, `institution_id`; **stop requiring `dob`** |

---

## User country from school (required)

**Do not ask the client for country at signup.**

When a user registers with `institution_id`, **derive their country from that institution’s `country` field** and persist it on the user profile (e.g. `user.address.country`, `user.country`, or whatever field powers **country leaderboard** today).

Example on create:

```python
institution = validated_data["institution"]
user.institution = institution
user.country = institution.country  # or map into address.country
```

- Every active institution must have a valid ISO country code.
- If `institution.country` is missing, reject registration with `400` (do not create a user without a resolvable country).
- Country leaderboard (`GET /api/leaderboards/rankings/summary` → `country`) should use this stored value, consistent with school rank using `institution_id`.

---

## 1. `Institution` (data + list endpoint)

**Model (minimum):** `name`, `city`, `country` (ISO-2, required for active rows), `is_active`, `is_featured`.

**`GET /api/institutions/`** — public, no auth.

| Query | Behavior |
|-------|----------|
| No `q` (or empty) | Return featured active schools (`is_featured=True`), up to `limit` (default 20, max 50) |
| `q` (≥ 2 chars) | Search by name; `400` if `q` is 1 character |
| `offset`, `limit` | Pagination |

**Response:**

```json
{
  "results": [
    { "id": 42, "name": "University of Ghana", "city": "Accra", "country": "GH" }
  ],
  "count": 1204,
  "next": null
}
```

Use indexed/trigram search on large tables — avoid unindexed full-table `icontains` scans.

---

## 2. `GET /api/auth/username/check/` (new)

Public. Query: `username` (required).

- Validate: 3–30 chars, `^[a-zA-Z0-9_]+$`, block reserved names (`admin`, `you`, `support`, etc.).
- Check uniqueness via normalized field (e.g. `username_normalized = username.lower().strip()`) with a **unique DB index** — O(1) lookup only.
- Rate-limit (~30/min per IP).

**Response:**

```json
{ "username": "janedoe", "available": true }
```

```json
{ "username": "janedoe", "available": false, "reason": "taken" }
```

---

## 3. `POST /api/register/` (update)

**New required fields:** `username`, `institution_id`  
**Removed requirement:** `dob` (mobile no longer sends it)

**Request body:**

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "password": "securepassword",
  "username": "janedoe",
  "institution_id": 42
}
```

**On create:**

1. Validate institution exists, `is_active=True`, and has `country`.
2. Validate username format; re-check uniqueness inside `transaction.atomic()`.
3. Set `user.institution` and **set user country from `institution.country`**.
4. Return **409** if username or email already exists.

**Response user object** should include at least: `username`, `institution_id` (nested `institution: { id, name }` optional).

---

## 4. Leaderboards (align with signup)

- **School rank:** group by `user.institution_id` (same institution).
- **Country rank:** use country **set from institution at signup**, not a separate client field.

---

## 5. Checklist

- [ ] `Institution` seeded with `country` on every active row; featured schools for empty search
- [ ] `GET /api/institutions/` live
- [ ] `GET /api/auth/username/check/` live with unique index on normalized username
- [ ] `POST /api/register/` accepts `username` + `institution_id`, does not require `dob`
- [ ] Register sets **user country from selected school**
- [ ] School/country leaderboard logic uses institution FK + stored country

---

## 6. Quick tests

1. Register with `institution_id` → user’s country matches institution’s `country`.
2. Register without `dob` → succeeds.
3. Duplicate username → `409`.
4. `GET /api/institutions/` with no `q` → featured list; with `q=ghan` → search results.
