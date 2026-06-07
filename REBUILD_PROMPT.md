# Inkseries — Complete Project Rebuild Guide

---

## 1. PROJECT OVERVIEW

**Project Name:** Inkseries

**Purpose:** A subscription-based serialized fiction platform for African teenage readers, modelled after streaming services (Netflix/Spotify UX patterns) but for episodic written fiction. Stories are released in episodes, grouped into seasons, and readers unlock new episodes as they publish — like following a TV series, but for books.

**Problem Solved:** African teenage fiction (especially Nigerian fiction) has no dedicated, mobile-first digital home. Print is expensive and hard to distribute; Wattpad and similar platforms are not optimised for the Nigerian/African market (no local payment options, no offline support for low-connectivity areas, no culturally relevant content). Inkseries fills this gap.

**Target Users:**
- Primary: Nigerian/African teenagers (13–22) who love fiction
- Secondary: Young African writers who want to publish serialised stories
- Tertiary: Parents managing family reading subscriptions

**Key Features:**
- Serialised episodic novels grouped into seasons
- Subscription gating: first 3 episodes of every novel are free; subsequent episodes require a trial or paid subscription
- 3-day free trial (no card required)
- Individual and family subscription plans priced in Nigerian Naira (₦)
- Flutterwave payment integration (supports Bank Transfer, USSD, Card — all popular in Nigeria)
- Offline downloads via IndexedDB (for low-connectivity use)
- Reading streaks, XP levels, and badge achievements
- Community features: polls (readers influence plot direction), discussions, chapter comments & reactions
- Real-time search, genre browsing, "Continue Reading" shelf
- Young Writers Challenge competition (₦500,000 prize pool)
- Gift subscriptions, referral rewards, user coins
- Admin panel with rich-text editor, Word/.docx and PDF import
- PWA (installable, offline-capable)
- Maintenance mode and Coming Soon mode with admin bypass
- Birthday celebrations (confetti animation)
- Story sharing to WhatsApp, Facebook, TikTok, Instagram

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework:** React 19.0.0 with TypeScript (strict mode)
- **Routing:** React Router v7.5.3 (file-based, with lazy loading)
- **Build Tool:** Vite 7.1.3 with `@cloudflare/vite-plugin` (SPA mode for Cloudflare Workers)
- **Styling:** TailwindCSS v3.4.17, dark mode via `class` strategy
- **Component Primitives:** Radix UI (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, select, slider, switch, tabs, tooltip)
- **Icons:** Lucide React 0.510.0
- **Rich Text Editor:** TipTap v3.23.1 (admin content creation)
- **File Parsing:** Mammoth 1.12.0 (Word .docx), pdfjs-dist 5.5.207 (PDF)
- **Animations:** canvas-confetti 1.9.4 (birthday celebrations)
- **Validation:** Zod 3.24.3

### Backend
- **Runtime:** Cloudflare Workers (edge, serverless)
- **Framework:** Hono 4.7.7 (ultra-lightweight web framework for Workers)
- **Database:** Cloudflare D1 (SQLite-compatible, edge-native) — with Supabase PostgreSQL as migration target
- **File Storage:** Cloudflare R2 (cover images, assets)
- **Email:** Mocha EMAILS service binding (`emails-service`)

### Auth
- **Provider:** `@getmocha/users-service` v0.0.4 — Google OAuth via the Mocha platform
- **React integration:** `@getmocha/users-service/react` (AuthProvider, useUser hook)
- Admin auth: checked via a separate `is_admin` field on the user object from the Mocha service

### Payments
- **Primary:** Flutterwave (redirect-based checkout — supports Card, Bank Transfer, USSD)
- **Secondary:** Paystack (env variable present, not fully implemented)
- All prices in Nigerian Naira (₦)

### PWA / Offline
- Service worker via Vite PWA plugin
- Offline downloads stored in IndexedDB (`inkseries-downloads` DB, `episodes` object store)

### Fonts
- **Display:** Bebas Neue (Google Fonts)
- **Body:** Source Sans 3 (Google Fonts)

### Config & Plugins
- `@getmocha/vite-plugins` v3.0.19 (provides TailwindCSS integration + other Mocha-platform tooling)
- `@cloudflare/vite-plugin` (Workers + D1 integration in Vite dev server)
- Wrangler 4.33.0 (Cloudflare Workers CLI)
- ESLint 9.25.1, TypeScript 5.8.3, Autoprefixer 10.4.21

---

## 3. PROJECT STRUCTURE

```
inkseries/
├── src/
│   ├── worker/
│   │   └── index.ts                  # Entire Cloudflare Worker / Hono API (~2500+ lines)
│   └── react-app/
│       ├── App.tsx                   # Router, AuthProvider, MaintenanceWrapper, all routes
│       ├── main.tsx                  # React entry point
│       ├── api.ts                    # Typed API client (fetch wrappers for all endpoints)
│       ├── pages/
│       │   ├── Home.tsx              # Landing + authenticated home (~700 lines)
│       │   ├── NovelDetail.tsx       # Novel page with season/episode list (~1215 lines)
│       │   ├── Reader.tsx            # Reading view with settings/offline (~1416 lines)
│       │   ├── Admin.tsx             # Full admin panel (~2000+ lines)
│       │   ├── Settings.tsx          # User settings + subscription management (~1000 lines)
│       │   ├── Explore.tsx           # Browse/search all novels
│       │   ├── Community.tsx         # Community discussions
│       │   ├── Polls.tsx             # Story polls listing
│       │   ├── Events.tsx            # Community events
│       │   ├── Library.tsx           # User's saved/downloaded novels
│       │   ├── Badges.tsx            # Achievement badges display
│       │   ├── Competition.tsx       # Young Writers Challenge 2026
│       │   ├── Certificate.tsx       # Competition certificate page
│       │   ├── Letterhead.tsx        # Letterhead page
│       │   ├── Onboarding.tsx        # New user onboarding flow
│       │   ├── Mentorship.tsx        # Mentorship program page
│       │   ├── Contact.tsx           # Contact page
│       │   ├── AuthCallback.tsx      # OAuth callback handler
│       │   ├── PaymentCallback.tsx   # Flutterwave payment return handler
│       │   ├── ComingSoon.tsx        # Coming soon page
│       │   ├── Maintenance.tsx       # Maintenance page
│       │   ├── Terms.tsx             # Terms of service
│       │   ├── Privacy.tsx           # Privacy policy
│       │   └── FAQ.tsx               # FAQ page
│       ├── components/
│       │   ├── SubscribeModal.tsx    # Subscription plan selection + payment init
│       │   ├── ChapterComments.tsx   # Per-chapter threaded comments
│       │   ├── ChapterReactions.tsx  # Emoji reactions on chapters
│       │   ├── StarRating.tsx        # 5-star rating widget
│       │   ├── ReadingStreak.tsx     # Streak display component
│       │   ├── ReadingLevel.tsx      # XP level/badge display
│       │   ├── Countdown.tsx         # Next episode countdown timer
│       │   ├── PWAInstallButton.tsx  # Install PWA floating button
│       │   ├── InstallPrompt.tsx     # PWA install prompt banner
│       │   └── ...                   # Other shared components
│       └── hooks/
│           ├── useDownloads.ts       # IndexedDB offline downloads
│           ├── useNovelsCache.ts     # In-memory novels cache (60s TTL)
│           ├── useRecordReading.ts   # Reading streak recording
│           └── ...                   # Other custom hooks
├── supabase/
│   └── migrations/
│       ├── 20260606204810_create_inkseries_schema.sql  # Full DB schema (~800 lines)
│       └── 20260607090739_fix_rls_policies_ownership.sql  # RLS policies (~576 lines)
├── public/
│   ├── favicon.ico                   # Used as cover image watermark
│   ├── manifest.json                 # PWA manifest
│   └── ...
├── wrangler.json                     # Cloudflare Workers config
├── vite.config.ts                    # Vite + Cloudflare + React config
├── package.json
├── tsconfig.json
└── .env                              # Local env vars (never committed)
```

---

## 4. CORE FEATURES

### Authentication Flow
1. User clicks "Sign In" → redirected to Mocha Google OAuth
2. OAuth callback at `/auth/callback` exchanges code for session via `@getmocha/users-service`
3. `AuthProvider` wraps the entire app; `useUser()` hook provides `{ user, isLoading }` everywhere
4. Admin check: `user.is_admin === true` (set on Mocha platform)
5. No custom auth tables — all identity managed by Mocha service

### Subscription Gating
- Every chapter has a `chapter_number` field
- Chapters 1–3 of any novel: free for all users
- Chapter 4+: requires one of:
  - Active trial (3 days, created via `/api/trial/start`, no payment)
  - Active paid subscription (any plan)
- The Worker API checks subscription status on every chapter content request and returns `{ gated: true }` if not eligible
- Frontend shows `<SubscribeModal>` when gated content is accessed

### Flutterwave Payment Flow
1. User selects plan in `<SubscribeModal>` → POST to `/api/payments/initialize`
2. Worker creates a Flutterwave payment link with `tx_ref`, amount, currency (NGN), redirect URL
3. User completes payment on Flutterwave hosted page
4. Flutterwave redirects to `/payment/callback?tx_ref=...&status=...`
5. `PaymentCallback.tsx` verifies with `/api/payments/verify`
6. Worker verifies transaction with Flutterwave API, creates subscription record in DB
7. Flutterwave also sends webhook to `/api/payments/webhook` for server-side confirmation

### Free Trial
- 3 days, no payment required
- Started via POST `/api/trial/start`
- Stored in `subscriptions` table with `plan_type = 'trial'`
- Trial users can download up to 15 episodes offline (enforced in `useDownloads.ts`)

### Offline Downloads (IndexedDB)
- DB: `inkseries-downloads`, version 1, object store: `episodes`
- Indices: `novelSlug`, `downloadedAt`
- `DownloadedEpisode` shape: `{ id, novelSlug, novelTitle, novelCover, chapterNumber, chapterTitle, content, wordCount, downloadedAt, seasonNumber, seasonTitle }`
- Trial limit: `TRIAL_DOWNLOAD_LIMIT = 15`
- Subscribed users: unlimited downloads
- `checkSubscriptionStatus()` reads from `/api/subscriptions/status`

### Reading Streaks & Badges
- Every chapter read is recorded via `useRecordReading` → POST `/api/reading/record`
- Streaks tracked in `user_streaks` table (current_streak, longest_streak, last_read_date)
- XP system: reading earns XP points; levels unlock badge titles
- Badges stored in `user_badges` table, awarded automatically when thresholds hit
- Badge achievements shown on profile and `Badges.tsx` page

### Subscription Plans (Prices in Nigerian Naira)

**Individual:**
| Plan | Price |
|------|-------|
| Weekly | ₦500/week |
| Monthly | ₦1,500/month |
| 3 Months | ₦4,000 |
| 6 Months | ₦7,000 (Most Popular) |
| Yearly | ₦14,400 |

**Family (4 accounts):**
| Plan | Price |
|------|-------|
| Weekly | ₦1,500/week |
| Monthly | ₦4,500/month |
| 3 Months | ₦11,000 |
| 6 Months | ₦20,000 (Most Popular) |
| Annual | ₦40,000 |

### Family Plans
- Created via POST `/api/family/create`
- Plan owner gets 1 seat, can invite up to 3 more members
- Members join via invite link/code
- Each member gets full subscription access
- Stored in `family_plans` + `family_plan_members` tables

### Refund Policy
- 7-day refund window for one-time (non-recurring) plans
- No refunds on recurring (weekly/monthly) plans
- Refund initiated via Settings page → POST `/api/subscriptions/refund`
- Stored in `refunds` table

### Referral System
- Each user gets a unique referral code (stored in `referrals` table)
- Sharing the code → clicks tracked in `referral_clicks`
- When referred user subscribes → referrer earns reward (coins/discount)
- Rewards stored in `referral_rewards` table

### Gift Subscriptions
- User sends gift to friend's email → stored in `gift_subscriptions`
- Friend redeems via unique code
- Payment via Flutterwave at gift purchase time

### Community Features
- **Polls:** Authors/admins create story polls; readers vote to influence plot. Tables: `polls`, `poll_options`, `poll_votes`
- **Discussions:** Community discussion threads. Tables: `community_discussions`, `discussion_likes`, `discussion_replies`
- **Chapter Comments:** Per-chapter comments. Tables: `chapter_comments`, `comment_likes`
- **Chapter Reactions:** Emoji reactions on chapters. Table: `chapter_reactions`
- **Novel Ratings:** 1–5 star ratings. Table: `novel_ratings`

### Story Polls (Detail)
- Admins create polls with 2–4 options via Admin panel
- Polls are tied to specific novels or global
- Readers can vote once per poll
- Results displayed as percentage bars
- Closing date configurable

### Competition — Young Writers Challenge 2026
- Prize pool: ₦500,000
- Submissions stored in `competition_submissions`
- Admin reviews and scores submissions in `submission_scores`
- Certificate generated and displayed at `/competition/certificate`
- Letterhead at `/competition/letterhead`

### Maintenance & Coming Soon Modes
- `MaintenanceWrapper` in `App.tsx` calls `/api/maintenance/status` and `/api/coming-soon/status` on every load
- If maintenance mode active: all users see `<MaintenancePage>` except admins
- If coming soon mode active: all users see `<ComingSoonPage>` except admins
- Admin bypass: if `user.is_admin === true`, normal app is shown
- Coming Soon page shows countdown to configured launch date
- Admin can send email blast to waitlist from Admin panel

### Admin Panel (Tabs)
1. **Overview:** Platform stats, revenue charts, active subscription counts
2. **Manage:** Novel CRUD, chapter CRUD, cover image upload to R2, TipTap rich text editor for chapter content, .docx and PDF import
3. **Content:** Poll creation and management, events creation
4. **Users:** User list, subscription status, account management
5. **Admins:** Super-admin role management (grant/revoke admin)
6. **Analytics:** Reading stats, popular chapters, engagement metrics

### Reading Experience (Reader.tsx)
- Font size: adjustable (via slider)
- Font style: Serif / Sans-Serif / Monospace
- Theme: Light / Dark / Sepia
- Line height: adjustable
- Progress: scroll position saved per chapter, restored on re-open
- Season-aware navigation: prev/next chapter respects season boundaries
- Auto-hide controls on scroll down, show on scroll up
- Share buttons: WhatsApp, Facebook, TikTok, Instagram (Web Share API)

### Novel Detail Page (NovelDetail.tsx)
- Cover image with watermark (Inkseries favicon overlay)
- Author info, description, genre tags
- StarRating component (displays average, allows authenticated user to rate)
- Episode list grouped by season (collapsible season sections)
- Premium episodes show blurred preview with lock icon
- Next episode countdown timer (`Countdown` component) for scheduled releases
- Continue reading button for in-progress novels
- Share novel button, download cover button

---

## 5. COMPONENTS & PAGES

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `Home.tsx` | Netflix-style landing with tilted mosaic hero, horizontal scroll rows, pricing |
| `/explore` | `Explore.tsx` | Genre browse, search, all novels grid |
| `/novel/:slug` | `NovelDetail.tsx` | Novel page, season/episode list |
| `/novel/:slug/read/:chapter` | `Reader.tsx` | Full reading view |
| `/community` | `Community.tsx` | Discussion threads |
| `/polls` | `Polls.tsx` | Story polls listing and voting |
| `/events` | `Events.tsx` | Community events |
| `/library` | `Library.tsx` | User's library + downloads |
| `/settings` | `Settings.tsx` | Profile, subscription, family plan, gifts, referrals |
| `/admin` | `Admin.tsx` | Full admin panel (admin-only) |
| `/badges` | `Badges.tsx` | Achievement badges showcase |
| `/competition` | `Competition.tsx` | Young Writers Challenge page |
| `/competition/certificate` | `Certificate.tsx` | Winner certificate view |
| `/competition/letterhead` | `Letterhead.tsx` | Official letterhead |
| `/onboarding` | `Onboarding.tsx` | New user welcome flow |
| `/mentorship` | `Mentorship.tsx` | Mentorship program info |
| `/contact` | `Contact.tsx` | Contact form |
| `/auth/callback` | `AuthCallback.tsx` | OAuth return handler |
| `/payment/callback` | `PaymentCallback.tsx` | Flutterwave return handler |
| `/coming-soon` | `ComingSoon.tsx` | Pre-launch countdown page |
| `/maintenance` | `Maintenance.tsx` | Maintenance message page |
| `/terms` | `Terms.tsx` | Terms of service |
| `/privacy` | `Privacy.tsx` | Privacy policy |
| `/faq` | `FAQ.tsx` | Frequently asked questions |

### Key Components

**`SubscribeModal.tsx`**
- Two tabs: Individual Plans / Family Plans
- Plan selection with pricing and feature list
- Highlights popular plan (6-month individual, 6-month family)
- "First 3 episodes free" + "Powered by Flutterwave" footer
- Calls `/api/payments/initialize` on plan selection

**`ChapterComments.tsx`**
- Threaded comments on each chapter
- Like/unlike comments
- Delete own comments; admins delete any

**`ChapterReactions.tsx`**
- Emoji reaction palette on each chapter
- Reaction count display

**`StarRating.tsx`**
- Interactive 5-star widget
- Shows average rating and review count

**`ReadingStreak.tsx`**
- Current streak (days), longest streak
- Calendar heatmap of reading activity

**`ReadingLevel.tsx`**
- Current XP, level name, progress to next level
- Badge icon for current level

**`Countdown.tsx`**
- Days/hours/minutes/seconds countdown
- Used for next episode release and coming soon page

**`PWAInstallButton.tsx`**
- Floating install button (bottom-right)
- Shows only when PWA install prompt is available

### UI Patterns
- Horizontal scroll rows (overscroll-x: auto, custom scrollbar hidden) for story carousels
- Card-based novel tiles with cover image, title, genre tag, episode count
- Modal-over-everything for subscribe, sign-in prompts
- Radix UI Dialog for all modals
- Radix UI Tabs for multi-section pages (admin, settings, novel detail)
- Radix UI Accordion for FAQs and collapsible season lists
- Radix UI Dropdown for user menu and sort/filter options
- Radix UI Slider for font size and line height in reader
- Radix UI Switch for toggles (notifications, dark mode)
- Skeleton loading states (custom CSS animation)
- Toast notifications (custom, not a third-party toast library)

---

## 6. INSTALLATION & SETUP

### Prerequisites
- Node.js 18+
- A Cloudflare account with Workers, D1, and R2 enabled
- A Mocha platform account (for `@getmocha/users-service` auth)
- A Flutterwave account (for payments)
- A Supabase project (for PostgreSQL DB, if migrating away from D1)

### Install Dependencies
```bash
npm install
```

### Environment Variables

Create `.env` in the project root:

```env
# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret

# Paystack (optional, secondary payment provider)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx

# Mocha / Auth
MOCHA_APP_ID=your_mocha_app_id

# Admin
ADMIN_SECRET=your_admin_bypass_secret

# Supabase (if using Supabase instead of D1)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx
```

For Cloudflare Workers, set secrets with:
```bash
npx wrangler secret put FLUTTERWAVE_SECRET_KEY
# ... repeat for each secret
```

### Database Setup

**Option A: Cloudflare D1 (original)**
```bash
# Create D1 database
npx wrangler d1 create inkseries-db
# Update wrangler.json with the returned database_id
# Run migrations
npx wrangler d1 migrations apply DB
```

**Option B: Supabase (migration target)**
1. Create a Supabase project at supabase.com
2. In the Supabase SQL editor, run the migration files in order:
   - `supabase/migrations/20260606204810_create_inkseries_schema.sql`
   - `supabase/migrations/20260607090739_fix_rls_policies_ownership.sql`
3. Set the Supabase credentials as Cloudflare Worker secrets

### R2 Bucket Setup
```bash
npx wrangler r2 bucket create inkseries-covers
# Update wrangler.json r2_buckets binding if bucket name differs
```

### Build
```bash
npm run build
```

### Dev Server
```bash
npm run dev
```
Vite runs the SPA on localhost:5173 and the Worker API on localhost:8787 (via `@cloudflare/vite-plugin`).

### Type Generation (after schema changes)
```bash
npm run cf-typegen
```

---

## 7. CONFIGURATION FILES

### `wrangler.json`
```json
{
  "name": "019c7e46-a70c-702a-a31e-1ed858d1b13c",
  "main": "./src/worker/index.ts",
  "compatibility_date": "2025-06-17",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "upload_source_maps": true,
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "inkseries-db", "database_id": "<your-d1-id>" }
  ],
  "r2_buckets": [
    { "binding": "R2_BUCKET", "bucket_name": "inkseries-covers" }
  ],
  "services": [
    { "binding": "EMAILS", "service": "emails-service", "entrypoint": "EmailsService" }
  ]
}
```

### `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import { mochaPlugins } from "@getmocha/vite-plugins";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [mochaPlugins(), react(), cloudflare()],
  server: { allowedHosts: true },
  build: { chunkSizeWarningLimit: 5000 },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### `package.json` (key sections)
```json
{
  "name": "mocha-app",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite dev",
    "check": "tsc --noEmit",
    "lint": "eslint .",
    "knip": "knip",
    "cf-typegen": "wrangler types"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.5.3",
    "hono": "^4.7.7",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@tiptap/react": "^3.23.1",
    "@tiptap/starter-kit": "^3.23.1",
    "@tiptap/extension-text-align": "^3.23.1",
    "@tiptap/extension-underline": "^3.23.1",
    "@tiptap/extension-color": "^3.23.1",
    "lucide-react": "^0.510.0",
    "mammoth": "^1.12.0",
    "pdfjs-dist": "^5.5.207",
    "canvas-confetti": "^1.9.4",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "vite": "^7.1.3",
    "typescript": "^5.8.3",
    "wrangler": "^4.33.0",
    "@cloudflare/vite-plugin": "latest",
    "@getmocha/vite-plugins": "^3.0.19",
    "@getmocha/users-service": "^0.0.4",
    "@vitejs/plugin-react": "latest",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.25.1"
  }
}
```

---

## 8. DEPLOYMENT

### Platform
- **Frontend + API:** Cloudflare Workers (single Worker serves both the SPA assets and the Hono API)
- **Database:** Cloudflare D1 (or Supabase PostgreSQL)
- **File Storage:** Cloudflare R2
- **Auth:** Mocha platform (external SaaS)
- **Payments:** Flutterwave (external SaaS)

### Deployment Steps

```bash
# 1. Build
npm run build

# 2. Deploy Worker
npx wrangler deploy

# 3. Set production secrets (first time or on rotation)
npx wrangler secret put FLUTTERWAVE_SECRET_KEY
npx wrangler secret put FLUTTERWAVE_PUBLIC_KEY
npx wrangler secret put FLUTTERWAVE_ENCRYPTION_KEY
npx wrangler secret put FLUTTERWAVE_WEBHOOK_SECRET
npx wrangler secret put ADMIN_SECRET
```

### Environment Variables in Production
All secrets are stored as Cloudflare Worker secrets (encrypted at rest, injected at runtime). Never use `.env` files in production Workers.

### Build Command (for CI/CD)
```
npm run build && npx wrangler deploy
```

### Database Considerations
- D1 is globally replicated at the edge — very low latency but limited to SQLite feature set
- Supabase PostgreSQL offers richer querying, full-text search, real-time subscriptions
- RLS policies in Supabase (`supabase/migrations/`) must be applied before going live
- Keep migrations in the `supabase/migrations/` folder and apply with Supabase MCP tools (not CLI)

### Custom Domain
- Configure in Cloudflare dashboard: Workers & Pages → your Worker → Custom Domains
- Add `inkseries.com` (or your domain) as a custom domain
- Flutterwave webhook URL: `https://yourdomain.com/api/payments/webhook`

### Cron Jobs
- The Worker has a scheduled cron handler (`scheduled()`) for:
  - Checking expired subscriptions and marking them inactive
  - Processing scheduled plan changes (upgrades/downgrades)
  - Sending subscription expiry reminder emails
- Configure in `wrangler.json`:
  ```json
  "triggers": { "crons": ["0 0 * * *"] }
  ```

---

## 9. THE COMPLETE PROMPT

Below is the exact prompt you can give to an AI to rebuild this project from scratch.

---

```
Build a full-stack serialized fiction platform called "Inkseries" — a subscription-based reading app for African teenagers, modelled on Netflix/Spotify UX but for episodic written fiction. The platform is Nigerian-market-first: all prices in Nigerian Naira (₦), Flutterwave as the primary payment processor.

---

## TECH STACK

- **Frontend:** React 19, TypeScript, React Router v7 (lazy-loaded routes), TailwindCSS v3 (dark mode via `class`), Radix UI primitives, Lucide React icons
- **Backend:** Cloudflare Workers + Hono framework (REST API and SPA hosting in a single Worker)
- **Database:** Cloudflare D1 (SQLite) with option to migrate to Supabase PostgreSQL
- **Storage:** Cloudflare R2 (cover images)
- **Auth:** @getmocha/users-service (Google OAuth, provides useUser() hook and AuthProvider)
- **Payments:** Flutterwave (redirect checkout), Paystack as fallback
- **Build:** Vite 7 with @cloudflare/vite-plugin and @getmocha/vite-plugins
- **Offline:** IndexedDB via useDownloads hook (custom)
- **PWA:** Service worker, installable
- **Fonts:** Bebas Neue (display), Source Sans 3 (body) from Google Fonts
- **Other packages:** TipTap v3 (rich text editor), Mammoth (Word import), pdfjs-dist (PDF import), canvas-confetti (birthday), Zod (validation)

---

## DATABASE SCHEMA

Create the following tables. Every table must have RLS enabled in Supabase with policies restricting reads/writes to authenticated users or admins as appropriate.

### Core Content
```sql
CREATE TABLE novels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  author_name TEXT,
  author_bio TEXT,
  genre TEXT[],
  tags TEXT[],
  status TEXT DEFAULT 'ongoing',  -- 'ongoing' | 'completed' | 'hiatus'
  is_featured BOOLEAN DEFAULT false,
  release_schedule TEXT,          -- e.g. "Every Monday"
  next_episode_at TIMESTAMPTZ,
  total_reads INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seasons (
  id TEXT PRIMARY KEY,
  novel_id TEXT REFERENCES novels(id),
  season_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  novel_id TEXT REFERENCES novels(id),
  season_id TEXT REFERENCES seasons(id),
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,                   -- HTML from TipTap
  word_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,  -- first 3 chapters are free
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Users
```sql
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,            -- same as auth.uid()
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  birth_date DATE,
  email_notifications BOOLEAN DEFAULT true,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_libraries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  novel_id TEXT REFERENCES novels(id),
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chapters_read (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chapter_id TEXT REFERENCES chapters(id),
  novel_id TEXT REFERENCES novels(id),
  progress_percent INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reading_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  novel_id TEXT REFERENCES novels(id),
  chapter_id TEXT REFERENCES chapters(id),
  read_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE user_streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  total_days_read INTEGER DEFAULT 0,
  xp_points INTEGER DEFAULT 0
);

CREATE TABLE user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,       -- 'streak_7', 'streak_30', 'level_5', etc.
  earned_at TIMESTAMPTZ DEFAULT now()
);
```

### Subscriptions & Payments
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,        -- 'trial' | 'weekly' | 'monthly' | '3months' | '6months' | 'yearly' | 'family_weekly' | etc.
  status TEXT DEFAULT 'active',   -- 'active' | 'expired' | 'cancelled' | 'refunded'
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  flutterwave_tx_ref TEXT,
  amount_paid INTEGER,            -- in kobo (smallest unit)
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payment_charges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES subscriptions(id),
  tx_ref TEXT UNIQUE,
  amount INTEGER,
  currency TEXT DEFAULT 'NGN',
  status TEXT,                    -- 'pending' | 'successful' | 'failed'
  flutterwave_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE refunds (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES subscriptions(id),
  amount INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE family_plans (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES subscriptions(id),
  max_members INTEGER DEFAULT 4,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE family_plan_members (
  id TEXT PRIMARY KEY,
  family_plan_id TEXT REFERENCES family_plans(id),
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scheduled_plan_changes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_subscription_id TEXT REFERENCES subscriptions(id),
  new_plan_type TEXT NOT NULL,
  change_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gift_subscriptions (
  id TEXT PRIMARY KEY,
  sender_user_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  redemption_code TEXT UNIQUE,
  redeemed_by TEXT,
  redeemed_at TIMESTAMPTZ,
  payment_tx_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Referrals & Coins
```sql
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT,
  referral_code TEXT NOT NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referral_clicks (
  id TEXT PRIMARY KEY,
  referral_code TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referral_rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  referral_id TEXT REFERENCES referrals(id),
  reward_type TEXT,               -- 'coins' | 'discount'
  reward_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_coins (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0
);

CREATE TABLE coin_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER,                 -- positive = earned, negative = spent
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Community & Engagement
```sql
CREATE TABLE chapter_comments (
  id TEXT PRIMARY KEY,
  chapter_id TEXT REFERENCES chapters(id),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comment_likes (
  id TEXT PRIMARY KEY,
  comment_id TEXT REFERENCES chapter_comments(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chapter_reactions (
  id TEXT PRIMARY KEY,
  chapter_id TEXT REFERENCES chapters(id),
  user_id TEXT NOT NULL,
  reaction TEXT NOT NULL,         -- emoji string
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE community_discussions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discussion_replies (
  id TEXT PRIMARY KEY,
  discussion_id TEXT REFERENCES community_discussions(id),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discussion_likes (
  id TEXT PRIMARY KEY,
  discussion_id TEXT REFERENCES community_discussions(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE novel_ratings (
  id TEXT PRIMARY KEY,
  novel_id TEXT REFERENCES novels(id),
  user_id TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  novel_id TEXT REFERENCES novels(id),
  question TEXT NOT NULL,
  closes_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE poll_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT REFERENCES polls(id),
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0
);

CREATE TABLE poll_votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT REFERENCES polls(id),
  option_id TEXT REFERENCES poll_options(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Events & Competition
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT true,
  registration_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_reminders (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id),
  user_id TEXT NOT NULL,
  remind_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE competition_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT,
  manuscript_url TEXT,
  author_name TEXT,
  author_age INTEGER,
  author_state TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE submission_scores (
  id TEXT PRIMARY KEY,
  submission_id TEXT REFERENCES competition_submissions(id),
  reviewer_id TEXT NOT NULL,
  score INTEGER,
  feedback TEXT,
  scored_at TIMESTAMPTZ DEFAULT now()
);
```

### Platform Settings & Waitlists
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Keys used: 'maintenance_mode', 'maintenance_message', 'coming_soon_mode', 'launch_date'

CREATE TABLE early_access_emails (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  signed_up_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE launch_waitlist (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  signed_up_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE writer_waitlist (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  writing_sample TEXT,
  signed_up_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscription_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_type TEXT,         -- 'expiry_warning' | 'expired' | 'renewed'
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscription_cancellations (
  id TEXT PRIMARY KEY,
  subscription_id TEXT REFERENCES subscriptions(id),
  user_id TEXT NOT NULL,
  reason TEXT,
  cancelled_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE birthday_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  notified_at TIMESTAMPTZ DEFAULT now()
);
```

---

## BACKEND API (Cloudflare Worker + Hono)

Create `src/worker/index.ts` implementing a Hono API. All routes are prefixed `/api/`. The Worker also serves the SPA assets via the ASSETS binding.

### Endpoint Groups

**Auth / Users**
- `GET /api/auth/me` — return current user profile (from Mocha users-service + user_profiles join)
- `PUT /api/auth/profile` — update display_name, bio, avatar_url, birth_date
- `DELETE /api/auth/account` — delete user account and all associated data

**Novels**
- `GET /api/novels` — list all novels (with query params: genre, status, featured, limit, offset)
- `GET /api/novels/:slug` — get single novel with seasons and chapters (content excluded by default)
- `POST /api/novels` — create novel (admin only)
- `PUT /api/novels/:id` — update novel (admin only)
- `DELETE /api/novels/:id` — delete novel (admin only)

**Seasons & Chapters**
- `GET /api/novels/:novelId/seasons` — list seasons for a novel
- `POST /api/novels/:novelId/seasons` — create season (admin only)
- `GET /api/chapters/:id` — get chapter content (apply subscription gate: chapters 1–3 free, others require trial/subscription)
- `POST /api/chapters` — create chapter (admin only)
- `PUT /api/chapters/:id` — update chapter (admin only)

**Subscription Gate Logic:**
```
if chapter.chapter_number <= 3:
  return chapter with content
else:
  check subscriptions table for user_id where status='active' AND expires_at > now()
  if active subscription or trial found:
    return chapter with content
  else:
    return { gated: true, chapter_number, title } without content
```

**Subscriptions**
- `GET /api/subscriptions/status` — get user's current subscription status
- `POST /api/trial/start` — start 3-day free trial (no payment, one per user)
- `POST /api/subscriptions/cancel` — cancel subscription
- `POST /api/subscriptions/refund` — request refund (within 7 days, one-time plans only)

**Payments (Flutterwave)**
- `POST /api/payments/initialize` — create Flutterwave payment link
  - Body: `{ plan_type, redirect_url }`
  - Generates `tx_ref` (UUID), inserts into `payment_charges`, calls Flutterwave API
  - Returns `{ payment_link }`
- `POST /api/payments/verify` — verify payment after redirect
  - Body: `{ tx_ref }`
  - Calls Flutterwave verify API, if successful creates subscription record
- `POST /api/payments/webhook` — Flutterwave webhook (verify HMAC signature)

**Flutterwave integration example:**
```typescript
const initializePayment = async (amount: number, email: string, txRef: string, redirectUrl: string) => {
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      redirect_url: redirectUrl,
      customer: { email },
      customizations: { title: 'Inkseries Subscription', logo: 'https://inkseries.com/favicon.ico' }
    })
  });
  const data = await response.json();
  return data.data.link;
};
```

**Family Plans**
- `POST /api/family/create` — create family plan (calls Flutterwave, higher price tiers)
- `POST /api/family/join` — join family plan via invite code
- `DELETE /api/family/leave` — leave family plan
- `GET /api/family/members` — list members of user's family plan

**Gift Subscriptions**
- `POST /api/gifts/send` — purchase and send a gift subscription
- `POST /api/gifts/redeem` — redeem a gift code

**Referrals**
- `GET /api/referrals/code` — get user's referral code (create if not exists)
- `POST /api/referrals/click` — record a referral click
- `GET /api/referrals/stats` — get referral stats (clicks, conversions, rewards)

**Community**
- `GET /api/chapters/:id/comments` — list comments
- `POST /api/chapters/:id/comments` — add comment
- `DELETE /api/comments/:id` — delete comment (own or admin)
- `POST /api/comments/:id/like` — toggle like
- `GET /api/chapters/:id/reactions` — get reaction counts
- `POST /api/chapters/:id/reactions` — add/toggle reaction
- `GET /api/discussions` — list discussions
- `POST /api/discussions` — create discussion
- `POST /api/discussions/:id/replies` — reply to discussion
- `POST /api/discussions/:id/like` — like discussion
- `POST /api/novels/:id/rate` — rate a novel (1–5 stars)

**Polls**
- `GET /api/polls` — list active polls
- `GET /api/polls/:id` — get poll with vote counts
- `POST /api/polls` — create poll (admin only)
- `POST /api/polls/:id/vote` — cast vote (one vote per user per poll)

**Events**
- `GET /api/events` — list upcoming events
- `POST /api/events` — create event (admin only)
- `POST /api/events/:id/remind` — set reminder for event

**Reading / Streaks**
- `POST /api/reading/record` — record a chapter read (updates user_streaks, reading_activity, chapters_read)
- `GET /api/reading/streak` — get user's streak data
- `GET /api/reading/history` — get reading history
- `GET /api/badges` — get user's earned badges

**Library**
- `GET /api/library` — get user's library
- `POST /api/library` — add novel to library
- `DELETE /api/library/:novelId` — remove from library

**Competition**
- `POST /api/competition/submit` — submit competition entry
- `GET /api/competition/submissions` — list all submissions (admin only)
- `POST /api/competition/score` — score a submission (admin only)

**Maintenance & Settings**
- `GET /api/maintenance/status` — `{ active: boolean, message: string }`
- `GET /api/coming-soon/status` — `{ active: boolean, launch_date: string }`
- `PUT /api/admin/settings` — update app_settings (admin only)
- `POST /api/admin/launch-email` — send launch email blast to waitlist (admin only)

**Admin**
- `GET /api/admin/users` — list all users with subscription info
- `GET /api/admin/analytics` — platform stats (reads, subscriptions, revenue)
- `POST /api/admin/grant` — grant admin role to user
- `DELETE /api/admin/revoke/:userId` — revoke admin role

**Waitlists**
- `POST /api/waitlist/launch` — join launch waitlist
- `POST /api/waitlist/writer` — join writer waitlist

**R2 File Upload**
- `POST /api/upload/cover` — upload novel cover image to R2, return public URL (admin only)

**Cron Handler**
```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 1. Find subscriptions expiring in 3 days → send reminder email via env.EMAILS
    // 2. Find expired subscriptions → mark status='expired'
    // 3. Process scheduled_plan_changes where change_at <= now()
  }
}
```

---

## FRONTEND PAGES

### App.tsx
Wrap everything in `<AuthProvider>` from `@getmocha/users-service/react`. Wrap routes in a `MaintenanceWrapper` that:
1. On mount, fetches `/api/maintenance/status` and `/api/coming-soon/status`
2. If maintenance active and user is not admin → render `<MaintenancePage>`
3. If coming soon active and user is not admin → render `<ComingSoonPage>`
4. Otherwise → render children normally

Preload novels on mount: `preloadNovels()` from `useNovelsCache`

Lazy-load all pages except Home and Maintenance.

Routes:
```
/ → Home
/explore → Explore
/novel/:slug → NovelDetail
/novel/:slug/read/:chapterNumber → Reader
/community → Community
/polls → Polls
/events → Events
/library → Library
/settings → Settings
/admin → Admin (protected: must be admin)
/badges → Badges
/competition → Competition
/competition/certificate → Certificate
/competition/letterhead → Letterhead
/onboarding → Onboarding
/mentorship → Mentorship
/contact → Contact
/auth/callback → AuthCallback
/payment/callback → PaymentCallback
/coming-soon → ComingSoon
/maintenance → Maintenance
/terms → Terms
/privacy → Privacy
/faq → FAQ
```

### Home.tsx
- **Hero section:** Tilted mosaic of novel cover images as background (CSS transform: rotate(-8deg), overflow hidden container). Overlay with dark gradient. Foreground: headline "Africa's Stories, Your Way", subheadline, CTA buttons ("Start Free Trial" + "Browse Stories")
- **For authenticated users:** show "Continue Reading" shelf (last 3 novels in progress), replace CTA with "Browse New Episodes"
- **Horizontal scroll rows:** "New This Week", "Trending Now", "Romance", "Adventure", "Thriller", "School Life" — each row is a horizontally scrollable list of novel cards
- **Novel card:** cover image, title, genre tag, episode count. Click → navigate to `/novel/:slug`
- **Search bar:** real-time search dropdown showing matching novels as user types
- **Pricing section:** show both Individual and Family plan tables with ₦ prices
- **Free trial callout banner:** "3 Days Free, No Card Required"

### NovelDetail.tsx
- **Header:** Large cover image with Inkseries favicon watermark (bottom-right corner of cover). Novel title, author, genre tags
- **Rating:** `<StarRating>` component showing average + count. Clicking opens rating modal for auth users
- **Description:** truncated with "Read More" expand
- **Action buttons:** Add to Library, Share, Download Cover
- **Seasons accordion:** Each season is collapsible. Inside: chapter list. Each chapter row shows chapter number, title, word count, publication date. If chapter > 3 and user not subscribed: show lock icon + "Premium" badge + blurred preview of first 2 lines
- **`<Countdown>` component:** if `next_episode_at` is set, show countdown to next episode
- **`<ReadingStreak>` and `<ReadingLevel>`** for authenticated users

### Reader.tsx
- **Reader controls bar** (auto-hides on scroll down, re-appears on scroll up):
  - Back button (navigate to novel detail)
  - Chapter title
  - Settings gear icon → opens settings drawer
  - Download button (save for offline)
  - Share buttons: WhatsApp, Facebook, TikTok, Instagram
- **Settings drawer:**
  - Font size slider (14px–24px)
  - Font style: Serif / Sans-Serif / Monospace (radio buttons)
  - Theme: Light / Dark / Sepia (3 color swatches)
  - Line height slider (1.4–2.2)
- **Chapter content area:** renders HTML from TipTap (use `dangerouslySetInnerHTML`)
- **Reading progress:** on scroll, save `{ novelSlug, chapterNumber, scrollPercent }` to localStorage; restore on mount
- **Subscription gate:** before rendering content, check if chapter is gated. If gated: show first 150 words blurred + `<SubscribeModal>` overlay
- **Navigation:** prev/next chapter buttons, aware of season boundaries (Chapter 1 of Season 2 follows last chapter of Season 1)
- **Record reading:** on reaching 80% scroll, call `POST /api/reading/record`
- **Chapter reactions** (`<ChapterReactions>`) and **comments** (`<ChapterComments>`) below content

### Admin.tsx
Tabs: Overview | Manage | Content | Users | Admins | Analytics

**Manage tab:**
- Novel list with edit/delete buttons
- "Add Novel" form: title, slug (auto-generated from title), description, cover upload (to R2), genre multi-select, author name, author bio, status, release schedule
- Chapter list per novel, with edit/delete
- "Add Chapter" form: title, season select (or create new season), chapter number (auto-incremented), TipTap rich text editor, OR import from .docx (Mammoth) / PDF (pdfjs-dist)
- .docx import: use `mammoth.convertToHtml({ arrayBuffer })`, paste result into TipTap
- PDF import: use `pdfjs-dist` to extract text page by page, combine, paste into TipTap

**Content tab:**
- Poll creation: select novel (optional, for global polls leave blank), question text, 2–4 options, closing date
- Event creation: title, description, date, location, is_online toggle, registration URL

**Overview tab:**
- Total novels, chapters, users, active subscriptions
- Revenue chart (bar chart using CSS/SVG, no chart library needed)
- Recent signups list

**Settings panel (within Admin):**
- Maintenance mode toggle + message text input
- Coming Soon mode toggle + launch date picker
- "Send Launch Email" button → calls `/api/admin/launch-email`

### Settings.tsx
Sections:
1. **Profile:** Display name, bio, avatar URL, birth date → `PUT /api/auth/profile`
2. **Notifications:** Email notification toggle
3. **Subscription:** Current plan name + expiry date + days remaining. Upgrade/downgrade links. Cancel button. Refund button (visible only if within 7-day window and one-time plan)
4. **Family Plan:** If not in a family plan: "Create Family Plan" button (opens plan selection). If plan owner: member list with invite code sharing, remove member buttons. If member: "Leave Plan" button
5. **Gift Subscriptions:** "Send a Gift" button (opens gift modal with plan selection + recipient email). "Redeem Gift Code" input
6. **Referrals:** Display unique referral link + copy button. Stats: clicks, conversions, rewards earned
7. **Danger Zone:** "Delete Account" button with confirmation dialog

### SubscribeModal.tsx
Radix UI Dialog. Two tabs: Individual | Family (4 accounts).

Individual plans:
- Weekly ₦500 | Monthly ₦1,500 | 3 Months ₦4,000 | 6 Months ₦7,000 ★ | Yearly ₦14,400

Family plans (4 accounts):
- Weekly ₦1,500 | Monthly ₦4,500 | 3 Months ₦11,000 | 6 Months ₦20,000 ★ | Annual ₦40,000

★ = highlighted as "Most Popular"

On plan click:
- If individual: `POST /api/payments/initialize` → `{ payment_link }` → `window.location.href = payment_link`
- If family: `POST /api/family/create` → same redirect flow

Show payment method icons: 🏦 Bank Transfer | 📱 USSD | 💳 Card
Footer text: "First 3 episodes free • Powered by Flutterwave"

---

## OFFLINE DOWNLOADS (useDownloads.ts)

```typescript
const DB_NAME = 'inkseries-downloads';
const DB_VERSION = 1;
const STORE_NAME = 'episodes';
const TRIAL_DOWNLOAD_LIMIT = 15;

interface DownloadedEpisode {
  id: string;
  novelSlug: string;
  novelTitle: string;
  novelCover: string;
  chapterNumber: number;
  chapterTitle: string;
  content: string;
  wordCount: number;
  downloadedAt: string;
  seasonNumber: number;
  seasonTitle: string;
}
```

Open IndexedDB with `novelSlug` and `downloadedAt` indices. Export:
- `downloadEpisode(episode)` — add to IDB, enforce TRIAL_DOWNLOAD_LIMIT for trial users
- `removeDownload(id)` — remove from IDB
- `getDownloads()` — get all downloaded episodes
- `getStorageEstimate()` — `navigator.storage.estimate()`
- `checkSubscriptionStatus()` — fetch `/api/subscriptions/status`
- `canTrialUserDownload()` — check if under limit

---

## READING STREAKS (useRecordReading.ts)

On calling `recordReading(novelId, chapterId)`:
1. `POST /api/reading/record` with `{ novel_id, chapter_id }`
2. Backend: upsert `reading_activity` for today's date
3. Fetch user's `user_streaks` record
4. If `last_read_date` is yesterday → `current_streak += 1`
5. If `last_read_date` is today → no change
6. If more than 1 day gap → `current_streak = 1`
7. Update `longest_streak` if current > longest
8. Award XP: 10 XP per chapter read
9. Check badge thresholds: 7-day streak, 30-day streak, 100 chapters read, etc.
10. Return `{ streak, xp_earned, badges_earned }`

---

## NOVELS CACHE (useNovelsCache.ts)

```typescript
let cachedNovels: Novel[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds
const MAX_ITEMS = 50;

export function preloadNovels() {
  // called once on app mount, fetches GET /api/novels?limit=50
}

export function useNovelsCache() {
  // returns { novels, isLoading, refetch }
  // uses cached data if within TTL, else re-fetches
}
```

---

## DESIGN SYSTEM

**Colors:**
- Brand: deep orange/amber (#E8620A or similar warm tone) + cream/ivory (#FFF8F0)
- Background dark mode: #0F0F0F
- Background light mode: #FFFFFF / #FAFAFA
- Text primary: #1A1A1A (light) / #F5F5F5 (dark)
- Text secondary: #6B7280 (light) / #9CA3AF (dark)
- Accent: warm amber #F59E0B
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

**Typography:**
- Display headings: Bebas Neue, letter-spacing: 0.05em
- Body: Source Sans 3, line-height: 1.5
- Maximum 3 font weights: 400 (regular), 600 (semibold), 700 (bold)

**Spacing:** 8px base unit system (4, 8, 12, 16, 24, 32, 48, 64, 96px)

**Components look and feel:** Dark-first aesthetic (like a premium reading app). Novel covers are the primary visual element — let them breathe with generous spacing. Cards have subtle rounded corners (8–12px), soft shadows. Buttons: filled primary (orange), ghost secondary, destructive red.

---

## MAINTENANCE & COMING SOON

In `MaintenanceWrapper`:
```typescript
const [status, setStatus] = useState<'loading' | 'ok' | 'maintenance' | 'coming-soon'>('loading');

useEffect(() => {
  Promise.all([
    fetch('/api/maintenance/status').then(r => r.json()),
    fetch('/api/coming-soon/status').then(r => r.json()),
  ]).then(([maintenance, comingSoon]) => {
    if (maintenance.active && !user?.is_admin) setStatus('maintenance');
    else if (comingSoon.active && !user?.is_admin) setStatus('coming-soon');
    else setStatus('ok');
  });
}, [user]);
```

---

## PWA

In `vite.config.ts`, add VitePWA plugin:
```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico'],
  manifest: {
    name: 'Inkseries',
    short_name: 'Inkseries',
    theme_color: '#E8620A',
    background_color: '#0F0F0F',
    display: 'standalone',
    icons: [/* standard PWA icon sizes */]
  }
})
```

Show `<PWAInstallButton>` floating at bottom-right using `beforeinstallprompt` event.

---

## ENV VARIABLES REQUIRED

```
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_ENCRYPTION_KEY
FLUTTERWAVE_WEBHOOK_SECRET
PAYSTACK_SECRET_KEY
ADMIN_SECRET
SUPABASE_URL (if using Supabase)
SUPABASE_SERVICE_ROLE_KEY (if using Supabase)
```

---

## COMPETITION — YOUNG WRITERS CHALLENGE 2026

Page at `/competition`:
- Prize: ₦500,000 total prize pool
- Eligibility: Nigerian youth aged 13–25
- Submission form: title, synopsis (500 words max), manuscript upload (.docx or PDF), author name, age, state
- Deadline prominently displayed with `<Countdown>` component
- On submit: `POST /api/competition/submit` with form data

---

## BIRTHDAY FEATURE

On app load, if user's birth_date matches today's date (month + day) AND they haven't been notified this year:
1. Show confetti animation: `import confetti from 'canvas-confetti'; confetti({ particleCount: 150, spread: 80 })`
2. Show birthday toast/modal: "Happy Birthday [name]! Here's a gift from Inkseries 🎂"
3. Award bonus coins or extend subscription by 1 day
4. Record in `birthday_notifications` table to avoid repeat same year

---

## IMPORTANT NOTES

1. The subscription gate is enforced server-side in the Worker. Never trust the client to gate content.
2. Flutterwave `tx_ref` must be unique per transaction — use `crypto.randomUUID()`.
3. The Worker uses Hono's `c.env` to access D1 (via `env.DB`), R2 (via `env.R2_BUCKET`), and EMAILS (via `env.EMAILS`).
4. All admin routes are protected with middleware: verify `user.is_admin === true` via Mocha users-service before proceeding.
5. The EMAILS service binding is the Mocha platform email service — use `env.EMAILS.send({ to, subject, html })`.
6. For the reader font settings, persist choices to localStorage key `inkseries-reader-settings`.
7. Offline reading downloads the chapter HTML content into IndexedDB. The reader checks IndexedDB first; if found, renders offline without fetching.
8. Genre list: Romance, Adventure, Thriller, School Life, Fantasy, Mystery, Drama, Sci-Fi, Historical, Comedy.
9. Novel slugs are lowercase-hyphenated versions of titles, unique, used in URLs.
10. The platform name is "Inkseries" — one word, capital I.
```

---

*End of rebuild guide.*
