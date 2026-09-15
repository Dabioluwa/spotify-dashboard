# Spotify Listening Analytics Dashboard

Full-stack analytics dashboard that visualizes 91,000+ Spotify listening history records with interactive cross-filtering, a world map of artist origins, and real-time Now Playing tracking.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## Features

- **KPI Cards** — Total hours, total plays, unique artists, unique songs
- **Top Artists & Songs** — Ranked lists with click-to-filter
- **Listening Trend** — Monthly hours played area chart
- **Day of Week & Hourly Charts** — Bar charts showing listening habits
- **Skipped & Looped Tracks** — Behavior analytics
- **Artist Origins Map** — Interactive world map (react-simple-maps) with country-level play counts
- **Now Playing** — Live Spotify status with progress bar and device info
- **Cross-filtering** — Click any chart element to filter the entire dashboard; year filter dropdown
- **Auto-refresh** — Dashboard polls Supabase every 2 minutes for new data
- **Dark theme** — Spotify-inspired zinc/green palette

## Architecture

```
Spotify API  ──GitHub Actions (cron)──>  Supabase (Postgres)  ──Next.js dashboard──>  Browser
                                         │
MusicBrainz  ──GitHub Actions (daily)──>  artist_origins table
```

- **Dashboard** — Next.js 16 App Router (Vercel), all analytics computed client-side from raw rows
- **Background sync** — GitHub Actions runs `scripts/spotify-sync.js` every 5 minutes
- **Artist enrichment** — GitHub Actions runs `scripts/enrich-artists.js` daily via MusicBrainz

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts, react-simple-maps |
| Backend | Next.js API Routes (OAuth flow) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (Hobby tier) |
| CI/CD | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Spotify Developer](https://developer.spotify.com/dashboard) app
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone <your-repo-url>
cd "Spotify Dashboard"
cd web
npm install
```

### 2. Set up Supabase

Create three tables in your Supabase SQL editor:

```sql
-- Listening history
create table listening_history (
  id bigint generated always as identity primary key,
  ts timestamptz not null,
  played_at timestamptz generated always as (ts) stored,
  ms_played integer,
  track_name text,
  artist_name text,
  album_name text,
  spotify_track_uri text,
  reason_start text,
  reason_end text,
  shuffle boolean default false,
  skipped boolean default false,
  offline boolean default false,
  created_at timestamptz default now()
);

-- Artist origins (enriched via MusicBrainz)
create table artist_origins (
  id bigint generated always as identity primary key,
  artist_name text unique not null,
  origin_city text,
  origin_country text,
  origin_location text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 3. Configure environment variables

Create `web/.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-service-role-key
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REFRESH_TOKEN=your-spotify-refresh-token
```

### 4. Get Spotify credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Add `http://127.0.0.1:3000/spotify-callback` to **Redirect URIs**
4. Copy Client ID and Client Secret to `.env.local`
5. Visit `/api/spotify/login` to authorize and get a refresh token

### 5. Run locally

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add environment variables (same as `.env.local`)
4. Update Spotify Developer Dashboard redirect URI to `https://your-app.vercel.app/spotify-callback`
5. Deploy

### GitHub Actions

Add these secrets in **Settings > Secrets and variables > Actions**:

| Secret | Value |
|--------|-------|
| `SPOTIFY_CLIENT_ID` | Your Spotify Client ID |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify Client Secret |
| `SPOTIFY_REFRESH_TOKEN` | Your Spotify Refresh Token |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase service role key |

The workflows will run automatically:
- **Spotify Sync** — every 5 minutes (fetches recently played tracks)
- **Artist Enrichment** — daily at 2 AM UTC (looks up artist origins via MusicBrainz)

## Project Structure

```
Spotify Dashboard/
├── .github/workflows/
│   ├── spotify-sync.yml      # Cron: fetch Spotify history every 5 min
│   └── enrich.yml            # Cron: MusicBrainz artist lookup daily
├── scripts/
│   ├── spotify-sync.js       # Standalone sync script (runs in GitHub Actions)
│   └── enrich-artists.js     # Standalone enrichment script
└── web/
    └── src/
        ├── app/
        │   ├── page.tsx              # Server Component — loads data, auth
        │   ├── layout.tsx            # Root layout with Geist font
        │   ├── spotify-callback/     # OAuth callback handler
        │   └── api/spotify/          # Login, token, currently-playing, sync
        ├── components/
        │   ├── Dashboard.tsx         # Client orchestrator — computeAll(), filters
        │   ├── KPICards.tsx          # 4 metric cards
        │   ├── TopArtistsList.tsx    # Ranked artists with filter clicks
        │   ├── TopSongsList.tsx      # Ranked songs with filter clicks
        │   ├── ListeningTrend.tsx    # Monthly hours area chart
        │   ├── ListeningDaysChart.tsx # Day-of-week bar chart
        │   ├── HourlyProfileChart.tsx # 24-hour bar chart
        │   ├── ArtistOriginsMap.tsx  # World map with zoom + markers
        │   ├── NowPlaying.tsx        # Live Spotify status
        │   ├── SkippedTracks.tsx     # Skipped track count
        │   ├── LoopedTracks.tsx      # Looped track count
        │   └── LottieAnimations.tsx  # CSS loading animations
        └── lib/
            ├── types.ts             # TypeScript interfaces
            └── supabase.ts          # Supabase client singleton
```

## Database Schema

**`listening_history`** — ~91,500 rows, one per track play
| Column | Type | Notes |
|--------|------|-------|
| `ts` | timestamptz | Raw timestamp from Spotify |
| `played_at` | timestamptz | Generated from `ts` (do not insert) |
| `ms_played` | integer | Duration in milliseconds |
| `track_name` | text | Track title |
| `artist_name` | text | Primary artist |
| `album_name` | text | Album title |
| `spotify_track_uri` | text | Spotify URI |
| `reason_start` | text | `trackdone`, `fwdbtn`, `backbtn`, `clickrow` |
| `reason_end` | text | `trackdone`, `fwdbtn`, `backbtn` |
| `shuffle` | boolean | Was shuffle on |
| `skipped` | boolean | Did user skip early |

**`artist_origins`** — ~50 rows, enriched via MusicBrainz
| Column | Type | Notes |
|--------|------|-------|
| `artist_name` | text | Unique artist name |
| `origin_country` | text | Country of origin |
| `latitude` | numeric | Map coordinates |
| `longitude` | numeric | Map coordinates |

## License

Copyright Dabioluwa 2026.
