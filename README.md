# Chronicle

Share and discuss stories. A full-stack web app built with **Next.js 16** (App Router) + **PocketBase** + **Tailwind CSS**.

---

## Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Frontend    | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Backend     | PocketBase v0.38 (self-hosted)              |
| Language    | TypeScript                                  |
| State       | Zustand                                     |
| Auth        | PocketBase JWT + httpOnly cookies           |

---

## Database (PocketBase Collections)

### `users` (auth collection)
| Field      | Type     | Notes                              |
|------------|----------|------------------------------------|
| username   | text     | Unique login identity              |
| name       | text     | Display name (not unique)          |
| password   | password | Hashed automatically               |
| avatar     | file     | Profile picture                    |
| approved   | bool     | Admin must approve new accounts    |

### `stories`
| Field           | Type            | Notes                            |
|-----------------|-----------------|----------------------------------|
| title           | text            | Story headline                   |
| original_author | text            | Who originally wrote it          |
| content         | text            | Full story body                  |
| user_id         | relation→users  | Who published it                 |
| images          | file (multiple) | Up to 10 images, 50MB each       |
| videos          | file (multiple) | Up to 5 videos, 100MB each       |
| links           | json            | Array of URLs                    |
| created         | autodate        | Auto-generated                   |

### `comments`
| Field    | Type              | Notes                         |
|----------|-------------------|-------------------------------|
| story_id | relation→stories  | Parent story                  |
| user_id  | relation→users    | Comment author                |
| stance   | select            | `for`, `against`, or `neutral`|
| content  | text              | Comment body                  |
| images   | file (multiple)   | Up to 5 images, 10MB each     |
| created  | autodate          | Auto-generated                |

### API Rules
All collections: `@request.auth.id != ''` on list/view/create (authenticated users only).

---

## How to Run

You need **3 terminals**:

### Terminal 1 — PocketBase (backend)

```cmd
cd F:\project\chronicle
pocketbase.exe serve --http=127.0.0.1:8090
```

Output:
```
Server started at http://127.0.0.1:8090
├─ REST API:  http://127.0.0.1:8090/api/
└─ Dashboard: http://127.0.0.1:8090/_/
```

Create the superuser at `http://127.0.0.1:8090/_/` on first run.

### Terminal 2 — Setup collections

```cmd
cd F:\project\chronicle
pnpm setup:pb
```

This creates all collections, fields, and API rules automatically.

### Terminal 3 — Next.js (frontend)

```cmd
cd F:\project\chronicle
pnpm dev
```

Opens at `http://localhost:3000`.

---

## Features

### Auth Flow
- **Register** → account created with `approved=false` → "Waiting for admin approval" screen
- **Approve user** → admin checks `approved` checkbox in PocketBase Admin UI (`/_/`)
- **Login** → checks `approved` field → blocks unapproved users with message
- **Cookies** → auth token stored in `pb_auth` cookie (httpOnly-compatible)

### Home Page
- Responsive grid of **StoryCards** (1/2/3 columns)
- **FilterBar**: filter by publisher, search by author, sort newest/oldest
- Empty state when no stories exist

### Story Detail
- Full story with metadata (publisher, original author, date)
- **SourcesBlock**: displays links, image gallery, video player
- **CommentSection**: 3-column layout grouped by stance (For / Against / Neutral)
  - Count badges per group
  - Image upload support
  - Big resizable textarea

### Create Story
- Title, original author, content
- Dynamic link list (add/remove)
- Multi-file image upload
- Multi-file video upload
- Batch FormData submission

### Stance Colors
| Stance  | Color                              |
|---------|------------------------------------|
| For     | Green (emerald)                    |
| Against | Red                                |
| Neutral | Gray (zinc)                        |

---

## Project Structure

```
chronicle/
├── proxy.ts                    # Route protection (Next.js 16 proxy)
├── pocketbase.exe              # 🔒 Gitignored — download your own
├── pb_data/                    # 🔒 Gitignored — local DB (SQLite)
├── pb_migrations/              # ✅ Committed — share schema changes
├── .env.local                  # 🔒 Gitignored — local config
├── app/
│   ├── page.tsx                # Home (StoryFeed)
│   ├── login/page.tsx          # Sign in
│   ├── register/page.tsx       # Sign up + approval message
│   ├── create/page.tsx         # Create story form
│   └── story/[id]/page.tsx     # Story detail
├── components/
│   ├── AuthProvider.tsx        # Boot auth on mount
│   ├── NavBar.tsx              # Chronicle brand + logout
│   ├── StoryFeed.tsx           # Client-side story fetch
│   ├── StoryList.tsx           # Filter + grid
│   ├── StoryCard.tsx           # Story card
│   ├── FilterBar.tsx           # Publisher/author/sort
│   ├── SourcesBlock.tsx        # Sources, links, images, videos
│   ├── CommentSection.tsx      # Comments + image upload
│   └── EmptyState.tsx          # Reusable empty state
├── lib/
│   ├── pocketbase.ts           # Client PB singleton
│   ├── server-pb.ts            # Server PB instance
│   ├── cookieStore.ts          # Custom auth store (cookies)
│   └── utils.ts                # getFileUrl, formatDate
└── store/
    └── auth.ts                 # Zustand auth state
```

> **Note:** `pocketbase.exe` and `pb_data/` are in `.gitignore` — each developer must download PocketBase and run it locally. Only `pb_migrations/` (auto-generated migration files) are committed to share schema changes with the team.

---

## Scripts

| Command         | Description                              |
|-----------------|------------------------------------------|
| `pnpm dev`      | Start Next.js dev server (port 3000)     |
| `pnpm build`    | Production build                         |
| `pnpm start`    | Run production build                     |
| `pnpm setup:pb` | Auto-create collections + seed data      |
| `pnpm lint`     | Run ESLint                               |

---

## Deployment

### PocketBase → Railway

1. Go to [railway.app/template/pocketbase](https://railway.app/template/pocketbase)
2. Click Deploy → Railway provisions PocketBase with persistent storage
3. Copy the generated URL → set as `NEXT_PUBLIC_POCKETBASE_URL`

### Next.js → Vercel

```bash
npx vercel
```

Add `NEXT_PUBLIC_POCKETBASE_URL` in Vercel project settings → Environment Variables.

---

## Environment Variables

```env
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
PB_ADMIN_EMAIL=your-email@example.com
PB_ADMIN_PASSWORD=your-password
```
