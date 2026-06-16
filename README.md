<p align="center">
  <img src="https://img.shields.io/badge/version-8.0-ee4d2d?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Shopee_Affiliate-Official-ee4d2d?style=for-the-badge" alt="Shopee" />
  <img src="https://img.shields.io/badge/HERMES_AI-Agent-8b5cf6?style=for-the-badge" alt="Hermes" />
</p>

<h1 align="center">TheViralFindsMY</h1>

<h3 align="center">AI-Powered Shopee Affiliate Manager for the Malaysian Market</h3>

<p align="center">
  <em>Discover. Promote. Earn. — Supercharged with HERMES AI Intelligence</em>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Feature Modules](#feature-modules)
  - [1. Dashboard & Analytics](#1-dashboard--analytics)
  - [2. Product Discovery & Affiliate Links](#2-product-discovery--affiliate-links)
  - [3. Social Media Auto-Post](#3-social-media-auto-post)
  - [4. AI Content Generator](#4-ai-content-generator)
  - [5. Trend & Competitor Spy](#5-trend--competitor-spy)
  - [6. Profit Optimizer](#6-profit-optimizer)
  - [7. Content Studio (Mobile Creator)](#7-content-studio-mobile-creator)
  - [8. HERMES AI Hub](#8-hermes-ai-hub)
  - [9. Earnings & Payouts](#9-earnings--payouts)
  - [10. Gamification](#10-gamification)
- [Shopee API Integration](#shopee-api-integration)
  - [Dual Data Source System](#dual-data-source-system)
  - [GraphQL Client](#graphql-client)
  - [Webhook Events](#webhook-events)
  - [Getting Shopee API Access](#getting-shopee-api-access)
- [HERMES AI Agent](#hermes-ai-agent)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Malaysian Market Focus](#malaysian-market-focus)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**TheViralFindsMY** is a comprehensive, production-ready Shopee Affiliate management platform built specifically for the Malaysian market. It combines real-time product discovery, AI-powered content creation, intelligent automation, and deep analytics into a single, unified dashboard.

The platform is designed to help Malaysian Shopee affiliates maximize their earnings through:

- **Smart product discovery** with AI scoring and Commission XTRA detection
- **Automated content creation** in Manglish, Bahasa Malaysia, and English
- **Social media scheduling** optimized for Malaysian peak engagement times
- **Trend monitoring** with competitor intelligence and keyword tracking
- **HERMES AI Agent** for conversational insights, task automation, and skill management

> **Target Market:** Malaysia (RM currency, Shopee Malaysia, Malaysian consumer behavior)
> **Language Support:** English, Bahasa Malaysia, Manglish (Malaysian English)

---

## Key Features

| # | Feature | Description | Badge |
|---|---------|-------------|-------|
| 1 | **Dashboard** | Real-time stats, earnings trends, top products, activity feed | Core |
| 2 | **Product Discovery** | Search Shopee products, generate affiliate links, track commissions | Core |
| 3 | **Affiliate Links** | Create, manage, and track short affiliate links with click analytics | Core |
| 4 | **Analytics** | Click/conversion charts, country/device breakdowns, period comparisons | Core |
| 5 | **Commission Calculator** | Project earnings with same-shop/different-shop models, break-even analysis | Core |
| 6 | **Campaigns** | Organize links into campaigns with budgets and date ranges | Core |
| 7 | **Earnings & Payouts** | Track commissions, payout history, earning goals | Core |
| 8 | **Social Media Auto-Post** | Schedule posts to TikTok, IG, FB, YouTube, Twitter/X with AI captions | `NEW` |
| 9 | **AI Content Generator** | Video scripts, captions, hashtags, Shopee Live scripts in Manglish/BM | `AI` |
| 10 | **Trend Spy** | Trending products, keyword discovery, competitor analysis, seasonal alerts | `NEW` |
| 11 | **Profit Optimizer** | AI product scoring (0-100), Commission XTRA finder, earnings calculator | `AI` |
| 12 | **Content Studio** | Video script templates, TTS voiceover, timed captions, SRT export | `NEW` |
| 13 | **HERMES AI Hub** | Conversational AI, skills, tasks, insights, memory, automation | `AI` |
| 14 | **Achievements** | Badge system for milestones and earning goals | Gamification |
| 15 | **Leaderboard** | Affiliate ranking with period comparisons | Gamification |
| 16 | **Referrals** | Referral program management and tracking | Gamification |
| 17 | **Notifications** | Real-time alerts for conversions, commissions, and system events | System |
| 18 | **Settings** | Shopee API credentials, app preferences, connection management | System |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Zustand   │  │ React    │  │ TanStack │  │ Framer       │  │
│  │ Store     │  │ Query    │  │ Charts   │  │ Motion       │  │
│  └─────┬─────┘  └────┬─────┘  └──────────┘  └──────────────┘  │
│        │              │                                          │
│  ┌─────▼──────────────▼──────────────────────────────────────┐  │
│  │              shadcn/ui Component Library                   │  │
│  │     (46 components: Cards, Dialogs, Tables, Charts...)    │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │ fetch()
┌────────────────────────────▼────────────────────────────────────┐
│                     Next.js 16 API Routes                       │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │ /api/   │ │/api/     │ │/api/   │ │/api/   │ │/api/     │  │
│  │shopee/* │ │hermes/*  │ │trends/*│ │content/*│ │profit/*  │  │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └───┬────┘ └────┬─────┘  │
│       │           │           │          │           │          │
│  ┌────▼───────────▼───────────▼──────────▼───────────▼──────┐  │
│  │              z-ai-web-dev-sdk (AI Engine)                 │  │
│  │     LLM Chat | Web Search | TTS | Image Generation       │  │
│  └──────────────────────────────────────────────────────────┘  │
│       │                                                        │
│  ┌────▼─────────────────────────────────────────────────────┐  │
│  │              Prisma ORM (SQLite)                          │  │
│  │     18 Models: User, Link, Campaign, Conversion...       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
    ┌────▼────┐                        ┌──────▼──────┐
    │ Shopee  │                        │   SQLite    │
    │ GraphQL │                        │  Database   │
    │   API   │                        │ (db/*.db)   │
    └─────────┘                        └─────────────┘
```

### Design Principles

1. **Dual Data Source** — Every Shopee API call gracefully falls back to realistic mock data when API access is unavailable
2. **AI-First** — All content generation, analysis, and insights use z-ai-web-dev-sdk with algorithmic fallbacks
3. **Demo-Ready** — The app is fully functional with demo data out of the box — no external accounts needed
4. **Malaysian-Optimized** — Currency, language, peak times, seasonal events, and consumer behavior tuned for Malaysia
5. **Client-Side Routing** — Single-page app using Zustand store for navigation (not Next.js file-based routing)

---

## Tech Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16 | React framework with App Router |
| **TypeScript** | 5 | Type-safe JavaScript |
| **React** | 19 | UI library |

### UI & Styling
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **shadcn/ui** | Latest | 46 pre-built UI components (New York style) |
| **Radix UI** | Latest | Headless UI primitives (Dialog, Popover, Tabs, etc.) |
| **Lucide React** | Latest | Icon library |
| **Framer Motion** | 12 | Animations and transitions |
| **Recharts** | 2.15 | Data visualization charts |
| **next-themes** | 0.4 | Dark/light mode support |

### State & Data
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Zustand** | 5 | Client-side state management |
| **TanStack Query** | 5 | Server state management & caching |
| **TanStack Table** | 8 | Advanced data tables |
| **React Hook Form** | 7 | Form handling with Zod validation |

### Backend & Database
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Prisma** | 6 | ORM with SQLite |
| **z-ai-web-dev-sdk** | 0.0.18 | AI capabilities (LLM, TTS, Web Search) |
| **NextAuth.js** | 4 | Authentication (available) |

### Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| **date-fns** | 4 | Date manipulation |
| **uuid** | 11 | Unique ID generation |
| **sonner** | 2 | Toast notifications |
| **vaul** | 1 | Drawer component |
| **cmdk** | 1 | Command palette (⌘K) |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Bun** (recommended) or npm
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/thisisniagahub/theviralfindsmy.git
cd theviralfindsmy

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# (Optional) Shopee Affiliate API
# SHOPEE_APP_ID=your_app_id
# SHOPEE_SECRET=your_secret
# SHOPEE_REGION=my

# (Optional) NextAuth
# NEXTAUTH_SECRET=your_secret
# NEXTAUTH_URL=http://localhost:3000
```

> **Note:** The app works fully in demo mode without any API credentials. All Shopee features use realistic Malaysian market mock data.

### Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Build for production |
| `bun run lint` | Run ESLint checks |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database with fresh schema |

---

## Project Structure

```
theviralfindsmy/
├── prisma/
│   └── schema.prisma           # 18 Prisma models
├── db/
│   └── custom.db               # SQLite database
├── src/
│   ├── app/
│   │   ├── page.tsx            # Main SPA entry (all 18 pages)
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles + Shopee/Hermes theme
│   │   └── api/                # 28 API route handlers
│   │       ├── dashboard/
│   │       ├── analytics/
│   │       ├── earnings/
│   │       ├── links/
│   │       ├── campaigns/
│   │       ├── notifications/
│   │       ├── products/search/
│   │       ├── shopee/         # 8 Shopee-specific routes
│   │       ├── hermes/         # 6 Hermes AI routes
│   │       ├── trends/         # 3 Trend Spy routes
│   │       ├── content/        # 3 Content generation routes
│   │       ├── autopost/       # 3 Auto-post routes
│   │       ├── studio/         # 3 Studio routes
│   │       ├── profit/         # 3 Profit optimizer routes
│   │       └── seed/           # Database seeder
│   ├── components/
│   │   ├── layout/             # 4 layout components
│   │   │   ├── sidebar.tsx     # Desktop sidebar navigation
│   │   │   ├── header.tsx      # Top header with search
│   │   │   ├── mobile-nav.tsx  # Bottom nav (mobile)
│   │   │   └── mobile-sheet.tsx # Slide-out menu (mobile)
│   │   ├── pages/              # 18 page components
│   │   │   ├── dashboard-page.tsx
│   │   │   ├── products-page.tsx
│   │   │   ├── links-page.tsx
│   │   │   ├── analytics-page.tsx
│   │   │   ├── campaigns-page.tsx
│   │   │   ├── calculator-page.tsx
│   │   │   ├── earnings-page.tsx
│   │   │   ├── autopost-page.tsx
│   │   │   ├── content-page.tsx
│   │   │   ├── trends-page.tsx
│   │   │   ├── profit-page.tsx
│   │   │   ├── studio-page.tsx
│   │   │   ├── hermes-page.tsx
│   │   │   ├── achievements-page.tsx
│   │   │   ├── leaderboard-page.tsx
│   │   │   ├── referrals-page.tsx
│   │   │   ├── notifications-page.tsx
│   │   │   └── settings-page.tsx
│   │   └── ui/                 # 46 shadcn/ui components
│   ├── lib/
│   │   ├── utils.ts            # cn() utility
│   │   ├── db.ts               # Prisma client singleton
│   │   └── shopee/             # Shopee integration layer
│   │       ├── affiliate-api.ts  # Main service (auto-switch)
│   │       ├── graphql-client.ts # GraphQL + HMAC-SHA256 auth
│   │       └── mock-data.ts      # Malaysian market mock data
│   ├── store/
│   │   └── app-store.ts        # Zustand store (6 state slices)
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── hooks/
│       ├── use-toast.ts        # Toast notifications
│       └── use-mobile.ts       # Mobile detection
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## Feature Modules

### 1. Dashboard & Analytics

**Dashboard** (`/` → `dashboard` page)

The central command center displaying real-time performance metrics:

- **Stats Cards:** Total clicks, conversions, earnings, conversion rate with 30-day trend comparison
- **Activity Feed:** Recent clicks, conversions, and link activity
- **Top Products:** Best-performing affiliate products by earnings
- **Quick Actions:** Generate link, create campaign, post to social

**Analytics** (`analytics` page)

Deep-dive performance analysis:

- **Time-series Charts:** Clicks and conversions over 7/30/90 days
- **Geographic Breakdown:** Click origins by country
- **Device Analysis:** Desktop vs mobile vs tablet distribution
- **Category Performance:** Which product categories convert best
- **Period Comparison:** Compare current vs previous period metrics

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/dashboard` | GET | Aggregated stats with trend calculations |
| `/api/analytics` | GET | Time-series and breakdown data |

---

### 2. Product Discovery & Affiliate Links

**Products** (`products` page)

Discover and search Shopee products to promote:

- **Product Search:** Search by keyword with real Shopee API or mock data
- **Commission Preview:** See commission rates before generating links
- **One-Click Link Generation:** Create affiliate links instantly
- **Category Filters:** Browse by category, price range, commission rate
- **Demo/Live Badge:** Visual indicator of data source (mock vs real API)

**Affiliate Links** (`links` page)

Manage all your affiliate links:

- **Link Management:** Create, pause, expire links
- **Click Tracking:** Real-time click counts with device/geo data
- **Short Codes:** Auto-generated unique short codes for each link
- **Campaign Association:** Organize links into campaigns
- **Performance Metrics:** CTR, conversion rate, earnings per link

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/shopee/products` | GET | Search products (real or mock) |
| `/api/shopee/generate-link` | POST | Generate affiliate link + save to DB |
| `/api/links` | GET, POST | List/create affiliate links |
| `/api/products/search` | GET | AI-powered product search via web |

---

### 3. Social Media Auto-Post

**Auto Post** (`autopost` page) — `NEW`

Schedule and manage social media posts optimized for Malaysian audiences:

- **Multi-Platform:** TikTok, Instagram, Facebook, YouTube Shorts, Twitter/X
- **AI Caption Generation:** Auto-generate captions in Manglish/Bahasa/English
- **Affiliate Link Insertion:** Auto-insert Shopee affiliate links into posts
- **Smart Scheduling:** AI-recommended posting times based on Malaysian peak hours
- **Engagement Heatmap:** 24-hour engagement probability chart
- **7-Day Suggestions:** Next optimal posting windows for each platform

**Malaysian Peak Times:**
| Time Slot | Engagement Level | Description |
|-----------|-----------------|-------------|
| 7:00 - 9:00 PM | **Golden Hour** | Highest engagement, after work browsing |
| 12:00 - 2:00 PM | **Lunch Rush** | Second peak, lunch break browsing |
| 9:00 PM - 12:00 AM | **Impulse Hour** | Late night shopping, impulse buys |
| 6:00 - 8:00 AM | **Morning Commute** | Moderate engagement, news/social check |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/autopost` | POST, GET | Create/list scheduled posts |
| `/api/autopost/suggest-times` | GET | AI-suggested posting times |
| `/api/autopost/[id]` | PATCH, DELETE | Update/delete a post |

---

### 4. AI Content Generator

**AI Content** (`content` page) — `AI`

Generate marketing content tailored for the Malaysian market:

- **Content Types:**
  - Social media captions (platform-specific)
  - Video scripts (Hook → Problem → Solution → CTA)
  - Hashtag sets (#RacunShopee, #Budol, #SkincareMalaysia)
  - Shopee Live scripts (interactive, engagement-focused)
  - Product reviews and comparisons

- **Language Options:** English, Bahasa Malaysia, Manglish
- **Tone Options:** Casual, Professional, Excited, Funny
- **Content Library:** Save, favorite, and reuse generated content
- **Template System:** 8 pre-built templates for quick content creation

**Templates:**
| Template | Platform | Style |
|----------|----------|-------|
| Before/After | TikTok | Transformation reveal |
| Unboxing | TikTok | Product reveal + first impressions |
| Demo/Review | TikTok | Feature showcase |
| Try-On Haul | Instagram Reels | Fashion/beauty showcase |
| Live Script | Shopee Live | Interactive selling script |
| Product Comparison | Facebook | Side-by-side analysis |
| Price Reveal | TikTok/IG | Suspense + value reveal |
| Problem-Solution | All Platforms | Pain point → product solution |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/content/generate` | POST | AI content generation |
| `/api/content/templates` | GET | Pre-built content templates |
| `/api/content/library` | GET, POST, PATCH, DELETE | Content library CRUD |

---

### 5. Trend & Competitor Spy

**Trend Spy** (`trends` page) — `NEW`

Monitor market trends and competitor activity:

- **Trending Products:** AI-discovered trending products with trend direction indicators
- **Keyword Discovery:** Trending search terms with volume and competition data
- **Competitor Analysis:** Top Malaysian affiliate profiles and strategies
- **Seasonal Alerts:** Upcoming Malaysian shopping events (Raya, 11.11, 12.12, CNY)

**Seasonal Calendar (Malaysia):**
| Event | Period | Commission Boost |
|-------|--------|-----------------|
| Chinese New Year | Jan-Feb | 2-3x |
| Ramadan/Raya | Mar-Apr | 3-5x |
| Mid-Year Sale | 6-7 | 2-3x |
| 9.9 Sale | September 9 | 2-4x |
| 10.10 Sale | October 10 | 2-4x |
| 11.11 Sale | November 11 | 3-5x |
| 12.12 Sale | December 12 | 3-5x |
| Year-End Sale | December | 2-3x |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/trends/discover` | GET | AI-powered trending product discovery |
| `/api/trends/competitor` | GET | Competitor analysis |
| `/api/trends/keywords` | GET | Trending keywords with volume data |

---

### 6. Profit Optimizer

**Profit Optimizer** (`profit` page) — `AI`

AI-powered product scoring and commission maximization:

- **Product Scoring Engine:** Multi-factor profitability scoring (0-100)
  | Factor | Weight | Description |
  |--------|--------|-------------|
  | Commission Rate | 25% | Base + XTRA commission percentage |
  | Conversion Rate | 30% | Historical conversion probability |
  | Average Order Value | 20% | Price × commission potential |
  | Competition Level | 10% | Number of competing affiliates |
  | Sales Volume | 10% | Product popularity and demand |
  | Trend Direction | 5% | Growing/stable/declining |

- **Score Levels:**
  - `HOT` (80-100): Promote immediately
  - `GOOD` (60-79): Strong potential
  - `AVERAGE` (40-59): Consider carefully
  - `SKIP` (0-39): Not recommended

- **Commission XTRA Finder:** Auto-discover products with extra commission bonuses (up to 40-50% additional)
- **Earnings Calculator:** Project daily/monthly/yearly earnings with break-even analysis

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/profit/score` | POST | Product profitability scoring |
| `/api/profit/calculator` | POST | Commission earnings calculator |
| `/api/profit/xtra` | GET | Commission XTRA product finder |

---

### 7. Content Studio (Mobile Creator)

**Content Studio** (`studio` page) — `NEW`

Create video content optimized for mobile-first creation:

- **Video Script Generator:** 8 script templates with timed scenes
  | Template | Structure |
  |----------|-----------|
  | Before/After | Problem → Product → Application → Result → CTA |
  | Unboxing | Teaser → Unbox → Feature → Demo → CTA |
  | Demo | Hook → Feature → Benefit → Demo → CTA |
  | Price Reveal | Hook → Build-up → Reveal → Justify → CTA |
  | Comparison | Problem → Option A → Option B → Verdict → CTA |
  | Problem-Solution | Pain → Agitate → Solution → Result → CTA |
  | Testimonial | Story → Struggle → Discovery → Result → CTA |
  | Top 5 | Hook → Items → Bonus → CTA |

- **TTS Voiceover:** Text-to-speech in Bahasa Malaysia and English
- **Timed Captions:** SRT and JSON subtitle generation for short-form videos
- **Multi-Language:** Scripts in English, Bahasa, or Manglish

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/studio/script` | POST | AI video script generation |
| `/api/studio/caption` | POST | Timed subtitle generation |
| `/api/studio/tts` | POST | Text-to-speech synthesis |

---

### 8. HERMES AI Hub

**Hermes AI** (`hermes` page) — `AI`

Your intelligent affiliate marketing assistant powered by HERMES Agent:

- **Conversational AI:** Chat with HERMES about products, strategies, and insights
- **Skills Management:** Create, activate, and manage AI skills
- **Task Automation:** Schedule recurring tasks with cron expressions
- **Smart Insights:** AI-generated business insights based on your data
- **Persistent Memory:** HERMES remembers conversations and learns preferences
- **Connection Management:** Configure and test AI backend connection

**Insight Types:**
| Type | Description |
|------|-------------|
| Trend | Market trend alerts and opportunities |
| Opportunity | Revenue opportunities detected |
| Alert | Performance issues requiring attention |
| Recommendation | Actionable improvement suggestions |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/hermes/chat` | POST | Chat with HERMES AI |
| `/api/hermes/connection` | GET, POST | Get/test connection |
| `/api/hermes/insights` | GET | AI-generated insights |
| `/api/hermes/skills` | GET, POST | Skill management |
| `/api/hermes/tasks` | GET, POST | Task management |
| `/api/hermes/memory` | GET, DELETE | Memory management |

---

### 9. Earnings & Payouts

**Earnings** (`earnings` page)

Comprehensive earnings tracking and payout management:

- **Earnings Summary:** Total earnings, pending, confirmed, paid
- **Daily Earnings Chart:** Visual earnings trend over time
- **Recent Conversions:** Latest commission-confirming orders
- **Payout History:** All payout requests with status tracking
- **Earning Goals:** Set and track monthly/weekly/yearly earning targets

**Calculator** (`calculator` page)

Commission projection calculator:

- **Same-Shop Model:** Multiple items from same shop (higher commission)
- **Different-Shop Model:** Items from different shops
- **Projection:** Daily/monthly/yearly earnings estimates
- **Break-Even:** How many clicks needed to hit target

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/earnings` | GET | Earnings data with chart and goals |
| `/api/shopee/commissions` | GET | Commission orders from Shopee |
| `/api/profit/calculator` | POST | Earnings projection calculator |

---

### 10. Gamification

**Achievements** (`achievements` page)

Badge-based milestone system to motivate and track progress:

- Earning milestones (first RM100, RM1,000, RM10,000)
- Click milestones (100, 1,000, 10,000 clicks)
- Conversion milestones (first conversion, 100 conversions)
- Streak achievements (posting streaks, engagement streaks)

**Leaderboard** (`leaderboard` page)

Competitive affiliate ranking:

- Period-based rankings (weekly, monthly, all-time)
- Metrics: total earnings, clicks, conversions
- Compare against top Malaysian affiliates

**Referrals** (`referrals` page)

Referral program management:

- Track referral status (pending, active, converted)
- Commission tracking for referrals
- Referral link generation

---

## Shopee API Integration

### Dual Data Source System

The app implements an intelligent dual data source that automatically switches between real and mock data:

```
┌──────────────┐     Credentials     ┌──────────────┐
│  User Input  │ ──────────────────► │  AppSetting  │
│  (Settings)  │                     │  (Database)  │
└──────────────┘                     └──────┬───────┘
                                            │
                              ┌──────────────▼──────────────┐
                              │    ShopeeAffiliateService    │
                              │                              │
                              │  if credentials valid:       │
                              │    → ShopeeGraphQLClient     │
                              │  else:                       │
                              │    → ShopeeMockService       │
                              └──────────────┬───────────────┘
                                             │
                              ┌──────────────▼───────────────┐
                              │   Unified Response Format    │
                              │   source: "graphql_api" |    │
                              │            "mock"            │
                              └──────────────────────────────┘
```

Every API response includes a `source` field indicating whether data came from the real API (`graphql_api`) or mock service (`mock`).

### GraphQL Client

The `ShopeeGraphQLClient` implements the official Shopee Affiliate Open API:

- **Authentication:** HMAC-SHA256 signature on every request
- **Regional Endpoints:** Malaysia, Singapore, Indonesia, Thailand, Philippines, Vietnam
- **Operations:** Product search, link generation, commission orders, click stats
- **Error Handling:** Graceful fallback to mock data on API errors

### Webhook Events

| Event | Description | Processing |
|-------|-------------|------------|
| `order_conversion` | Customer completed purchase | Save conversion + create notification |
| `click` | Affiliate link clicked | Increment click counter |
| `commission_update` | Commission status changed | Update conversion status |

Webhook verification uses HMAC-SHA256 signature validation.

### Getting Shopee API Access

1. Register at [Shopee Affiliate Program](https://affiliate.shopee.com.my/)
2. Go to **Account > API > Open API**
3. Request access to the Shopee Affiliate Open API Platform
4. Generate your **App ID** and **Secret**
5. Enter credentials in **Settings > Shopee Integration**

> **Important:** Shopee Affiliate Open API uses GraphQL specification. You must request access separately — having an App ID/Secret is not sufficient without API platform access.

---

## HERMES AI Agent

HERMES is an AI agent integration inspired by Nous Research's HERMES architecture, adapted for affiliate marketing intelligence:

### Capabilities

| Feature | Description |
|---------|-------------|
| **Chat** | Natural language conversations about affiliate strategies |
| **Skills** | Custom AI skills that can be created, trained, and deployed |
| **Tasks** | Automated recurring tasks (cron-based scheduling) |
| **Insights** | AI-generated business insights from your data |
| **Memory** | Persistent conversation memory across sessions |

### Architecture

```
User Query → HERMES Chat API → z-ai-web-dev-sdk (LLM)
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              Skills Engine   Task Runner   Insight Generator
                    │             │             │
                    ▼             ▼             ▼
              HermesSkill    HermesTask    HermesInsight
              (Database)     (Database)    (Database)
```

### Pre-built Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| Product Analyzer | "analyze product" | Score products for profitability |
| Content Writer | "write content" | Generate marketing content |
| Trend Monitor | "check trends" | Discover trending products |
| Competitor Spy | "spy competitor" | Analyze competitor strategies |
| Commission Finder | "find commission" | Locate Commission XTRA products |

---

## API Reference

### Complete Route Table

| Route | Method | Auth | Cache | Description |
|-------|--------|------|-------|-------------|
| `/api/dashboard` | GET | - | - | Dashboard stats |
| `/api/analytics` | GET | - | - | Analytics data |
| `/api/earnings` | GET | - | - | Earnings overview |
| `/api/links` | GET, POST | - | - | Link CRUD |
| `/api/campaigns` | GET, POST | - | - | Campaign CRUD |
| `/api/notifications` | GET, PATCH | - | - | Notifications |
| `/api/seed` | POST | - | - | Database seeder |
| `/api/products/search` | GET | - | - | AI product search |
| `/api/shopee/config` | GET, POST, DELETE | - | - | Shopee credentials |
| `/api/shopee/connect` | POST, GET | - | - | Connection test |
| `/api/shopee/status` | GET | - | 5min | Connection status |
| `/api/shopee/webhook` | POST | HMAC | - | Webhook receiver |
| `/api/shopee/products` | GET | - | - | Product search |
| `/api/shopee/commissions` | GET | - | - | Commission orders |
| `/api/shopee/stats` | GET | - | - | Click stats |
| `/api/shopee/generate-link` | POST | - | - | Generate affiliate link |
| `/api/hermes/chat` | POST | - | - | AI chat |
| `/api/hermes/connection` | GET, POST | - | - | AI connection |
| `/api/hermes/insights` | GET | - | - | AI insights |
| `/api/hermes/skills` | GET, POST | - | - | Skill management |
| `/api/hermes/tasks` | GET, POST | - | - | Task management |
| `/api/hermes/memory` | GET, DELETE | - | - | Memory management |
| `/api/trends/discover` | GET | - | 30min | Trending products |
| `/api/trends/competitor` | GET | - | 30min | Competitor analysis |
| `/api/trends/keywords` | GET | - | 30min | Trending keywords |
| `/api/content/generate` | POST | - | - | Content generation |
| `/api/content/templates` | GET | - | - | Content templates |
| `/api/content/library` | GET, POST, PATCH, DELETE | - | - | Content library |
| `/api/autopost` | POST, GET | - | - | Scheduled posts |
| `/api/autopost/suggest-times` | GET | - | - | Best posting times |
| `/api/autopost/[id]` | PATCH, DELETE | - | - | Post management |
| `/api/studio/script` | POST | - | - | Video scripts |
| `/api/studio/caption` | POST | - | - | Timed captions |
| `/api/studio/tts` | POST | - | - | Text-to-speech |
| `/api/profit/score` | POST | - | - | Product scoring |
| `/api/profit/calculator` | POST | - | - | Earnings calculator |
| `/api/profit/xtra` | GET | - | - | Commission XTRA finder |

---

## Database Schema

The app uses 18 Prisma models stored in SQLite:

### Core Models
```
User ──┬── AffiliateLink ──── ClickRecord
       │                  └── Conversion
       ├── Campaign
       └── Referral

Payout          EarningGoal        Notification
AppSetting      Achievement        LeaderboardEntry
```

### HERMES Models
```
HermesConnection ── HermesConversation ── HermesMessage
HermesSkill       HermesTask           HermesInsight
AgentMemory
```

### Feature Models
```
ScheduledPost    ContentLibrary
```

### Enums
```
LinkStatus:     active | paused | expired
CampaignStatus: active | paused | completed
ConversionStatus: pending | confirmed | rejected | paid
PayoutStatus:   pending | processing | completed | failed
GoalStatus:     active | achieved | failed
GoalPeriod:     monthly | weekly | yearly | custom
UserRole:       admin | affiliate | viewer
HermesSkillStatus: active | draft | archived | learning
```

---

## Malaysian Market Focus

This platform is purpose-built for the Malaysian Shopee affiliate ecosystem:

### Commission Structure
| Type | Rate | Notes |
|------|------|-------|
| Base Commission | 2.5% - 12% | Product category dependent |
| Commission XTRA | Up to 40-50% extra | Promotional periods |
| Shopee Live | Up to 80% | Live streaming commissions |

### Top Malaysian Affiliates (Reference)
| Affiliate | Lifetime Earnings | Platform |
|-----------|------------------|----------|
| Sabrinabeautyhub | RM5M+ | TikTok + Shopee |
| Faisaldotmy | RM5M+ | TikTok |
| Erawan1308 | RM7,200/mo | Multi-platform |

### Best Platforms for Malaysian Affiliates
| Platform | Organic Reach | Conversion | Best For |
|----------|--------------|------------|----------|
| TikTok | Highest | High | Beauty, Fashion, Gadgets |
| Shopee Live | Medium | Very High | Flash sales, Demo |
| Instagram Reels | Medium | Medium | Beauty, Lifestyle |
| Facebook | Medium | Medium | General, Family products |

### Hashtag Strategy
| Hashtag | Usage | Category |
|---------|-------|----------|
| #RacunShopee | Viral products | General |
| #Budol | Wishlist items | General |
| #SkincareMalaysia | Beauty products | Beauty |
| #ShopeeMY | Platform tag | General |
| #ReviewMalaysia | Product reviews | General |
| #BarangMurah | Budget finds | Value |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is proprietary software for TheViralFindsMY.

---

<p align="center">
  <strong>Built with ❤️ for Malaysian Affiliates</strong><br/>
  <em>TheViralFindsMY v8.0 — Discover. Promote. Earn.</em>
</p>
