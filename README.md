# Deen — React Frontend

Privacy-first Islamic lifestyle companion. Free forever.

## Tech Stack

- **React 19** + **Vite 6**
- **TailwindCSS v3** with custom Islamic-inspired design tokens
- **TanStack Query v5** for server state
- **Zustand** for client state (persisted)
- **React Router v7**
- **Framer Motion** for animations
- **date-fns** for date handling
- **Fonts**: Playfair Display (headings) + DM Sans (body) + Amiri (Arabic)

## Design System

Colour palette built around Islamic greens (`emerald`), warm gold accents, and parchment backgrounds. Full dark mode. Islamic geometric pattern backgrounds. Arabic text support with `Amiri` font.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Split-panel login with Islamic geometric design |
| `/register` | Madhab + gender selection registration |
| `/onboarding` | 4-step wizard: name → location → goals |
| `/dashboard` | Overview: prayers, habits, streak, tasks |
| `/prayer` | Prayer times, logging, streak stats |
| `/quran` | Reader, Hifz tracker (SM-2), Dua library |
| `/habits` | Habit tracker with 12-week heatmap |
| `/journal` | Reflective journal with mood + gratitude |
| `/tasks` | Prayer-time-block planner |
| `/female` | Cycle tracker (fiqh-aware) + fasting tracker |
| `/ai` | AI lifestyle guide with fiqh referral |
| `/settings` | Profile, madhab, location, theme, security |

## Quick Start

```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000/api/v1

# Dev server (assumes backend running on :8000)
npm run dev

# Production build
npm run build
```

## Environment Variables

```
VITE_API_URL=http://localhost:8000/api/v1
```

Vite's dev proxy forwards `/api` → `localhost:8000` automatically.

## Features

- ✅ JWT auth with automatic token refresh
- ✅ Protected routes + onboarding guard
- ✅ Female module unlocks only for female users
- ✅ Multi-madhab-aware fiqh labels
- ✅ Heatmap streak visualisation
- ✅ SM-2 spaced repetition for Hifz
- ✅ AI chat with fiqh referral interception
- ✅ Full dark mode
- ✅ Mobile-responsive with collapsible sidebar
- ✅ i18n wired (English + Arabic keys ready)
- ✅ Encrypted female health data (handled by backend)
