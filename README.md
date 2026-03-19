# 🎯 AI Event Concierge Platform

An intelligent corporate event planning assistant that transforms natural language descriptions into structured, AI-generated venue proposals. Built as a full-stack Next.js application with type-safe APIs, persistent storage, and a clean modern UI.

**Live Demo:** [your-deployment-url.vercel.app](https://your-deployment-url.vercel.app)  
**GitHub:** [github.com/yourusername/ai-event-concierge-platform](https://github.com/Mahadsid/AI-Event-Concierge-Platform)

---

## 📸 Screenshots

> Replace these with actual screenshots after deployment

| Marketing Page                                   | Dashboard                                        | History                                      |
| ------------------------------------------------ | ------------------------------------------------ | -------------------------------------------- |
| ![Marketing](./public/screenshots/marketing.png) | ![Dashboard](./public/screenshots/dashboard.png) | ![History](./public/screenshots/history.png) |

---

## ✨ Features

- **Natural Language Input** — Describe your event in plain English (e.g. _"A 10-person leadership retreat in the mountains for 3 days with a $4k budget"_)
- **AI-Powered Proposals** — Structured venue recommendations with name, location, estimated cost, justification, and amenities
- **Persistent History** — Every request and proposal is saved to a PostgreSQL database and survives page refreshes
- **SSR Data Loading** — Dashboard pre-fetches history server-side, so data appears instantly with zero loading flash
- **Expandable History Cards** — Click any past request to expand full proposal details inline
- **Loading States** — Clear "AI is planning..." feedback during generation
- **Dark/Light Mode** — Full theme support with persistent preference
- **Toast Notifications** — Sonner toasts for success and error feedback
- **Type-Safe End-to-End** — From database schema to UI, every layer is fully typed

---

## 🏗️ Tech Stack

### Frontend

| Technology          | Version | Why it's Used It                                                                                                                    |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16**      | `16.x`  | Full-stack React framework with App Router, Server Components, and Route Handlers. Enables SSR for instant data loading on refresh. |
| **React 19**        | `19.x`  | UI library. Used Server Components for data fetching and Client Components for interactivity.                                       |
| **Tailwind CSS v4** | `4.x`   | Utility-first CSS. Zero-config theming, dark mode via `dark:` variants, consistent spacing.                                         |
| **shadcn/ui**       | latest  | Unstyled, accessible component primitives (Dialog, Tabs, Card, Badge, etc.) built on Radix UI. Copy-paste components we own fully.  |
| **Sonner**          | latest  | Toast notification library. Clean API: `toast.success()`, `toast.error()` — no setup overhead.                                      |
| **Lucide React**    | latest  | Consistent icon set. Tree-shakeable, typed, matches shadcn's design language.                                                       |

### Backend & API

| Technology         | Version | Why it's Used It                                                                                                                                                                              |
| ------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **oRPC**           | latest  | Type-safe RPC framework combining the DX of tRPC with OpenAPI compatibility. Procedures are defined with Zod schemas — the same types flow from server handler to client call automatically.  |
| **TanStack Query** | `v5`    | Async state management. Handles caching, background refetching, and optimistic updates. Used with oRPC's `createTanstackQueryUtils` for fully typed `queryOptions()` and `mutationOptions()`. |
| **Zod**            | `v3`    | Schema validation library. Used for: input validation on procedures, output shape validation, and parsing AI JSON responses before saving to DB.                                              |

### Database

| Technology     | Version | Why it's Used It                                                                                                                                                                        |
| -------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma ORM** | `7.x`   | Type-safe database client. Schema-first approach means your TypeScript types are always in sync with your database tables. Auto-generates a fully typed client from `schema.prisma`.    |
| **NeonDB**     | —       | Serverless PostgreSQL. Scales to zero when not in use (perfect for assignments/side projects), has a generous free tier, and works seamlessly with Prisma. Connection pooling built-in. |

### AI Integration

| Technology                   | Why it's Used It                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **OpenRouter**               | API gateway that provides access to 100+ LLMs through a single OpenAI-compatible endpoint. Free tier available.                          |
| **openai/gpt-oss-120b:free** | OpenAI's open-weight 117B MoE model. Supports structured output, function calling, and native tool use. Used via OpenRouter's free tier. |

### DevX & Tooling

| Technology     | Why it's Used It                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript** | Full type safety across the entire codebase — database models, API procedures, UI props, and AI response parsing all share types. |
| **pnpm**       | Fast, disk-efficient package manager. Uses hard links so packages aren't duplicated across projects.                              |
| **Turbopack**  | Next.js's Rust-based bundler (replaces Webpack). Significantly faster HMR during development.                                     |

---

## 🗄️ Database Schema

Two tables with a 1-to-1 relationship:

```
EventRequest                    VenueProposal
─────────────────────           ──────────────────────────
id          String (cuid)  ←──  eventRequestId  String (unique)
rawInput    String              id              String (cuid)
createdAt   DateTime            venueName       String
updatedAt   DateTime            location        String
                                estimatedCost   String
                                whyItFits       String (Text)
                                amenities       String[]
                                createdAt       DateTime
```

**Why separate tables?** Request and proposal have different shapes and lifecycles. A request is created immediately when the user submits. The proposal is created only after the AI responds successfully. If the AI fails, the request is rolled back — keeping data clean.

**Why `String` for `estimatedCost`?** AI returns ranges like `"$3,200–$4,000"`. Storing as string preserves the original format without lossy number conversion.

**Why `String[]` for `amenities`?** Native PostgreSQL array via Prisma. Zero extra join table needed for a simple list of strings.

---

## 🔄 Application Flow

```
User Input (natural language)
        │
        ▼
NewEventModal (Client Component)
        │
        ▼
orpc.ai.generateProposal.mutationOptions()  ← TanStack Query mutation
        │
        ▼
POST /rpc/ai/generateProposal  ← oRPC RPC handler
        │
        ├─ 1. Zod validates input (min 10 chars, max 500)
        ├─ 2. Save EventRequest to NeonDB via Prisma
        ├─ 3. POST to OpenRouter API (gpt-oss-120b:free)
        │      └─ System prompt forces JSON-only response
        ├─ 4. Zod parses + validates AI JSON response
        ├─ 5. Save VenueProposal linked to EventRequest
        └─ 6. Return full shape to client
                │
                ▼
        queryClient.invalidateQueries()  ← TanStack Query refetch
                │
                ▼
        ProposalCard renders with new data
        History tab updates with new entry
```

**On page refresh:**

```
Browser requests /dashboard
        │
        ▼
Server Component (page.tsx)
        │
        ├─ serverClient.event.list()  ← direct server call, zero HTTP
        └─ passes initialEvents to DashboardClient
                │
                ▼
        useQuery({ initialData: initialEvents })
        └─ TanStack Query seeds cache with SSR data
           No loading flash. Data available immediately.
```

---

## 📁 Project Structure

```
ai-event-concierge-platform/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx              # Minimal layout for marketing page
│   │   └── page.tsx                # Landing page with hero section
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell with header
│   │   └── dashboard/
│   │       ├── page.tsx            # Server Component — SSR data fetch
│   │       └── dashboard-client.tsx # Client Component — tabs, modal, mutations
│   ├── middlewares/
│   │   └── base.ts                 # oRPC base instance with error definitions
│   ├── router/
│   │   ├── index.ts                # Root router — exports AppRouter type
│   │   ├── ai.ts                   # generateProposal procedure
│   │   └── event.ts                # listEventRequests, getEventRequest procedures
│   ├── schemas/
│   │   └── event.ts                # Zod schemas — shared between frontend & backend
│   └── rpc/
│       └── [[...rest]]/
│           └── route.ts            # oRPC catch-all route handler
├── components/
│   ├── ui/                         # shadcn/ui components (auto-generated)
│   ├── providers.tsx               # TanStack Query provider
│   ├── new-event-modal.tsx         # Modal with form, examples, loading state
│   ├── proposal-card.tsx           # Full proposal display card
│   └── history-card.tsx            # Expandable history entry card
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── orpc.ts                     # Client-side oRPC + TanStack Query utils
│   └── orpc-server.ts              # Server-side direct router client
├── prisma/
│   └── schema.prisma               # Database schema
└── public/                         # Static assets
```

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js** 20+
- **pnpm** — install with `npm install -g pnpm`
- A **NeonDB** account (free) — [neon.tech](https://neon.tech)
- An **OpenRouter** account (free) — [openrouter.ai](https://openrouter.ai)

### 1. Clone the repository

```bash
git clone https://github.com/Mahadsid/AI-Event-Concierge-Platform.git
cd ai-event-concierge-platform
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root of the project:

```env
# NeonDB — get this from your Neon project dashboard
# Use the "pooled connection" string for better performance
DATABASE_URL="postgresql://username:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"

# OpenRouter — get this from openrouter.ai/settings/keys
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxx"

# Your app's URL (used as HTTP-Referer header for OpenRouter)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Important:** Never commit `.env` to git. It's already in `.gitignore`.

### 4. Set up the database

```bash
# Run migrations to create tables in NeonDB
pnpm prisma migrate dev --name init

# Generate the Prisma client
pnpm prisma generate
```

### 5. Configure OpenRouter privacy settings

The free `gpt-oss-120b` model requires data policy to be enabled:

1. Go to [openrouter.ai/settings/privacy](https://openrouter.ai/settings/privacy)
2. Enable **"Allow training data"** under Data Policy
3. Save settings

### 6. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Verify the setup

- Visit `http://localhost:3000` — you should see the marketing/landing page
- Click **Get Started** — you should be taken to the dashboard
- Click **New Event** — enter a description like _"A 10-person leadership retreat for 3 days with a $4k budget"_
- You should see the AI planning animation, then a venue proposal card appear

To inspect the database directly:

```bash
pnpm prisma studio
# Opens at http://localhost:5555
```

---

## ☁️ Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your repository
4. Vercel auto-detects Next.js — no build config needed

### 3. Add Environment Variables

In the Vercel project settings → **Environment Variables**, add:

| Key                   | Value                                                           |
| --------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`        | Your NeonDB pooled connection string                            |
| `OPENROUTER_API_KEY`  | Your OpenRouter API key                                         |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL (e.g. `https://your-app.vercel.app`) |

> **Critical:** Use the **pooled** NeonDB connection string for Vercel (not the direct one). Serverless functions need connection pooling or you'll hit connection limits.

### 4. Deploy

Click **Deploy**. Vercel will build and deploy automatically.

### 5. Run database migrations on production

After first deploy, run migrations against your production database:

```bash
# Set your production DATABASE_URL temporarily
$env:DATABASE_URL="your-production-neon-url"  # Windows PowerShell
# export DATABASE_URL="your-production-neon-url"  # Mac/Linux

pnpm prisma migrate deploy
```

Or use Vercel's build command to run migrations automatically — add this to your `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma migrate deploy && prisma generate && next build"
  }
}
```

Then set the **Build Command** in Vercel to `pnpm vercel-build`.

---

## 🔑 Environment Variables Reference

| Variable              | Required | Description                                                                                      |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`        | ✅ Yes   | NeonDB PostgreSQL connection string (use pooled URL for production)                              |
| `OPENROUTER_API_KEY`  | ✅ Yes   | OpenRouter API key starting with `sk-or-v1-`                                                     |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes   | Full URL of the app (e.g. `https://your-app.vercel.app`). Used as `HTTP-Referer` for OpenRouter. |

---

## 🧠 AI Prompting Strategy

The quality of AI output depends entirely on the system prompt. Here's the strategy used:

```
1. Role definition     — "You are an expert corporate event planning concierge"
2. Output constraint   — "Respond with ONLY a valid JSON object. No markdown. No code blocks."
3. Exact schema        — JSON structure with field names, types, and examples provided inline
4. Business rules      — Budget constraints, real venue names, specificity requirements
5. Fallback handling   — Instructions for missing location or budget
```

**Why strict JSON-only?** LLMs tend to wrap JSON in markdown code blocks (` ```json `) or add explanatory text. The system prompt explicitly forbids this, and the handler also strips any accidental fences with ` .replace(/```json|```/g, "") ` before parsing.

**Why low temperature (0.4)?** Lower temperature = more deterministic, consistent structure. We want reliable JSON, not creative variation.

**Zod as the final safety net** — even if the AI returns valid JSON, Zod validates it matches the exact expected shape before anything gets saved to the database.

---

## 🛠️ Key Technical Decisions

| Decision                                 | Reasoning                                                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **oRPC over tRPC**                       | oRPC generates OpenAPI specs alongside RPC — better for documentation and potential future REST client support                                        |
| **Server Components for data fetching**  | `page.tsx` fetches history via `serverClient` (direct call, no HTTP). Data is available on first render — no loading flash on refresh                 |
| **`initialData` in TanStack Query**      | SSR data seeds the client cache. After mutations, `invalidateQueries` triggers a fresh client-side fetch. Best of both SSR and client-side reactivity |
| **Save request before AI call**          | If the AI fails, we still have the user's input in the DB. We delete it on failure — but if delete also fails, the record is a harmless orphan        |
| **Direct `fetch` for OpenRouter**        | Avoids AI SDK version compatibility issues. The OpenRouter API is OpenAI-compatible so plain `fetch` with JSON body is the most reliable approach     |
| **`String[]` for amenities in Postgres** | Native array column — no join table, no serialization. Prisma handles it natively                                                                     |

---

## 📝 API Reference

All endpoints are served via oRPC at `/rpc/*`.

### `POST /rpc/ai/generateProposal`

Generates a venue proposal from natural language input.

**Request body** (oRPC envelope):

```json
{
  "json": {
    "rawInput": "A 10-person leadership retreat in the mountains for 3 days with a $4k budget"
  },
  "meta": []
}
```

**Response:**

```json
{
  "json": {
    "id": "cmmxbvo4b0001n8ugl452sbh1",
    "rawInput": "A 10-person leadership retreat...",
    "createdAt": "2026-03-19T10:00:00.000Z",
    "proposal": {
      "id": "cmmxbvo4b0002n8ugl452sbh2",
      "venueName": "The Leela Palace Udaipur",
      "location": "Udaipur, Rajasthan, India",
      "estimatedCost": "$3,500 – $4,000",
      "whyItFits": "The Leela Palace offers an intimate luxury setting...",
      "amenities": [
        "Lake-facing conference room",
        "Mountain hiking trails",
        "..."
      ],
      "createdAt": "2026-03-19T10:00:05.000Z",
      "eventRequestId": "cmmxbvo4b0001n8ugl452sbh1"
    }
  },
  "meta": []
}
```

### `POST /rpc/event/list`

Returns all past event requests with proposals, newest first.

### `POST /rpc/event/get`

Returns a single event request by ID.

**Request body:**

```json
{
  "json": { "id": "cmmxbvo4b0001n8ugl452sbh1" },
  "meta": []
}
```

---

## 🐛 Troubleshooting

### `PrismaClientValidationError` on startup

```bash
pnpm prisma migrate reset   # resets DB
pnpm prisma generate        # regenerates client
rm -rf .next                # clears Next.js cache
pnpm dev
```

### OpenRouter returns 404 "No endpoints available"

Go to [openrouter.ai/settings/privacy](https://openrouter.ai/settings/privacy) and enable **"Allow training data"** under Data Policy. The free model tier requires this.

### Hydration mismatch errors

Add `"use client"` to any component that uses Radix UI primitives (dropdowns, dialogs) or browser APIs (`window`, `localStorage`).

### `Input validation failed` from oRPC

oRPC uses its own JSON envelope format. Always send:

```json
{ "json": { ...your input... }, "meta": [] }
```

Not `{ "input": { ... } }`.

### Build fails on Vercel with Prisma errors

Add `prisma generate` to your build command:

```json
"vercel-build": "prisma migrate deploy && prisma generate && next build"
```

---

## 📄 License

MIT — feel free to use this as a reference for your own projects.

---

## 👤 Author

Built by **Muhammad Mahad**  
Portfolio: [your-portfolio-url.com](https://portfolio-2026-theta-eosin.vercel.app/)  
GitHub: [@yourusername](https://github.com/Mahadsid/)

---

_Built as part of a full-stack AI engineering assessment. Every architectural decision documented above was made deliberately — see the Key Technical Decisions section for reasoning._
