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

## License

Copyright Dabioluwa 2026.
