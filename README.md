# Team Finder

A platform for finding teammates and building projects together.

| Part | Location | Stack |
| --- | --- | --- |
| Frontend | `src/` | Next.js (App Router) · React · TypeScript · SCSS modules · Axios · TanStack Query · React Hook Form · Zod · React Icons |
| Backend | `server/` | Node.js · Express · TypeScript · PostgreSQL (`pg`) · JWT · bcryptjs · `ws` · Zod |

The two parts share no code. They talk only through the REST API and WebSocket contract below. Frontend types in `src/types/api.ts` mirror these response shapes.

## Running locally

```bash
# 1. Backend
cd server
cp .env.example .env          # set DATABASE_URL (create the database first) and JWT secrets
npm install
npm run migrate               # applies migrations/*.sql
npm run seed                  # demo data: 5 users, 5 projects, 13 skills
npm run dev                   # http://localhost:4100  (WS: ws://localhost:4100/ws)

# 2. Frontend (repo root)
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3100
```

Seeded logins, all with password `password123`: `timur@`, `aida@`, `bek@`, `daniel@`, `maya@teamfinder.dev`.

`npm run db:reset` (in `server/`) drops the schema, migrates, and reseeds.

### Environment

Frontend (`.env.local`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

Backend (`server/.env`): `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `AI_API_KEY`, `AI_MODEL`

`AI_API_KEY` is an Anthropic API key and stays on the server. Without it, `/api/ai/match` falls back to PostgreSQL keyword and skill matching.

## Backend architecture

```
Route (routes/index.ts) → Controller (validates with Zod, no SQL) → Service (business rules + parameterized SQL) → PostgreSQL
```

- **Auth:** 15-minute access JWT, sent as `Authorization: Bearer`. A 30-day refresh JWT is stored as an HTTP-only cookie scoped to `/api/auth`. Refresh tokens are stored hashed and rotated on every refresh. Reusing an old token more than 15 s after rotation revokes all of that user's sessions.
- **Security:** bcrypt (cost 12), Helmet, CORS limited to `CLIENT_URL` with credentials, rate limits (global, auth and AI), owner and membership checks in services, and parameterized SQL only. `password_hash` is never selected into API responses.
- **Integrity:** a partial unique index allows only one *pending* application (or invitation) per user per project. Accepting an application locks the project row, so two accepts can't overfill a role.

## Response format

```jsonc
{ "success": true, "data": { } }
{ "success": true, "data": [ ], "pagination": { "page": 1, "limit": 20, "total": 100 } }
{ "success": false, "message": "You already applied to this project." }
```

## REST API (`/api`)

🔒 = requires `Authorization: Bearer <accessToken>`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register` | `{name, username, email, password}` → `{user, accessToken}` + refresh cookie |
| POST | `/auth/login` | `{email, password}` → `{user, accessToken}` + refresh cookie |
| POST | `/auth/refresh` | uses the cookie → new `{user, accessToken}`, rotates the cookie |
| POST | `/auth/logout` | revokes the refresh token, clears the cookie |
| GET 🔒 | `/auth/me` | current `UserProfile` |
| GET | `/users` | `?search&skills=React,Figma&role&experience&availability&page&limit` |
| GET 🔒 | `/users/me` · PATCH 🔒 `/users/me` | profile fields: `name, username, avatar, bio, jobTitle, githubUrl, telegramUrl, linkedinUrl, experience, availability` |
| GET | `/users/:id` | public profile incl. `skills`, `teams` |
| GET | `/skills` | `?search` |
| POST 🔒 | `/users/me/skills` | `{name}` or `{skillId}` (creates the skill if new) |
| DELETE 🔒 | `/users/me/skills/:skillId` | |
| GET | `/projects` | `?search&category&status&skills&role&ownerId&memberId&page&limit` |
| GET | `/projects/categories` | |
| GET | `/projects/:id` | `ProjectDetail` (members, roles, and a `viewer` block when authenticated) |
| POST 🔒 | `/projects` | `{name, description, category, image?, status?, roles:[{name, description?, requiredCount, skills:[]}]}` (the owner is added as a member) |
| PATCH 🔒 | `/projects/:id` | owner only; `roles` with an `id` are updated, roles without one are created, missing roles are deleted |
| DELETE 🔒 | `/projects/:id` | owner only |
| POST 🔒 | `/projects/:id/applications` | `{roleId?, message?}` |
| GET 🔒 | `/projects/:id/applications` | owner only |
| GET 🔒 | `/applications/me` | `?type=sent\|received&status` |
| PATCH 🔒 | `/applications/:id` | `{status: accepted\|rejected}` (owner) or `cancelled` (applicant). Accepting adds the user to members and sends a notification. |
| POST 🔒 | `/projects/:id/invitations` | owner only; `{userId, roleId?}` |
| GET 🔒 | `/invitations` | `?type=received\|sent` |
| PATCH 🔒 | `/invitations/:id` | receiver only; `{status: accepted\|rejected}` |
| GET | `/projects/:id/members` | |
| DELETE 🔒 | `/projects/:id/members/:userId` | owner only |
| POST 🔒 | `/projects/:id/leave` | member (not owner) |
| GET 🔒 | `/projects/:id/messages` | members only; `?page&limit` (page 1 = newest; each page is ordered oldest → newest) |
| POST 🔒 | `/projects/:id/messages` | `{content}`; REST fallback that also broadcasts over WS |
| GET 🔒 | `/notifications` | paginated, plus top-level `unreadCount` |
| GET 🔒 | `/notifications/unread-count` | |
| PATCH 🔒 | `/notifications/:id/read` · `/notifications/read-all` | |
| GET 🔒 | `/recommendations` | `{projects, users}` ranked by skill overlap |
| POST 🔒 | `/ai/match` | `{description}` → `{requirements, matches:[{userId, matchPercent, matchedSkills, missingSkills, user}], source: "ai"\|"keywords"}` |

## WebSocket

Connect with `ws://host/ws?token=<accessToken>`, or `ws://host/ws/project/:projectId?token=…` to auto-join a room. The server verifies the JWT on upgrade and checks project membership before any join or send.

Client → server:

```json
{ "type": "join_project", "projectId": 12 }
{ "type": "leave_project", "projectId": 12 }
{ "type": "send_message", "projectId": 12, "content": "Всем привет!" }
{ "type": "typing_start", "projectId": 12 }
{ "type": "typing_stop", "projectId": 12 }
```

Server → client:

| type | payload |
| --- | --- |
| `connected` | `userId` |
| `joined_project` | `projectId, onlineUserIds` |
| `new_message` | `data: {id, projectId, sender:{id,name,username,avatar,jobTitle}, content, createdAt}` |
| `typing_start` / `typing_stop` | `projectId, user:{id,name}` |
| `user_online` / `user_offline` | `userId` (sent to teammates) |
| `new_notification` | `data: Notification, unreadCount` |
| `member_left` / `removed_from_project` | `projectId[, userId]` |
| `error` | `message[, event, projectId]` |

Members who aren't viewing a team chat get at most one unread `NEW_MESSAGE` notification per project.
