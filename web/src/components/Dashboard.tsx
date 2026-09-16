'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  TopArtist,
  TopSong,
  MonthlyStats,
  SkipBehavior,
  LoopTrack,
  HourlyHabit,
  ArtistOrigin,
  DayOfWeekStat,
  DashboardFilters,
  SpotifyUserProfile,
} from '@/lib/types'

import AIRemarkBanner from '@/components/AIRemarkBanner'
import KPICards from '@/components/KPICards'
import TopArtistsList from '@/components/TopArtistsList'
import TopSongsList from '@/components/TopSongsList'
import ListeningTrend from '@/components/ListeningTrend'
import ListeningDaysChart from '@/components/ListeningDaysChart'
import HourlyProfileChart from '@/components/HourlyProfileChart'
import LoopedTracks from '@/components/LoopedTracks'
import SkippedTracks from '@/components/SkippedTracks'
import ArtistOriginsMap from '@/components/ArtistOriginsMap'
import NowPlaying from '@/components/NowPlaying'
import { MusicBars } from '@/components/LottieAnimations'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ORDERED_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface RawRow {
  ts: string | null
  ms_played: number | null
  artist_name: string | null
  track_name: string | null
  reason_end: string | null
}

function filterRows(rows: RawRow[], year?: string, artist?: string): RawRow[] {
  return rows.filter((row) => {
    if (!row.ts) return false
    const date = new Date(row.ts)
    if (isNaN(date.getTime())) return false
    if (year && String(date.getUTCFullYear()) !== year) return false
    if (artist && row.artist_name !== artist) return false
    return true
  })
}

function computeAll(raw: RawRow[]) {
  const dayMap = new Map<string, { total_hours: number; total_plays: number }>()
  ORDERED_DAYS.forEach((d) => dayMap.set(d, { total_hours: 0, total_plays: 0 }))

  const hourMap = new Map<number, { total_hours: number; total_streams: number }>()
  for (let h = 0; h < 24; h++) hourMap.set(h, { total_hours: 0, total_streams: 0 })

  const monthMap = new Map<string, { total_hours: number; total_streams: number }>()
  const artistMap = new Map<string, { total_hours: number; total_plays: number; skips: number }>()
  const trackMap = new Map<string, {
    artist_name: string
    track_name: string
    total_plays: number
    total_ms: number
    skips: number
    backbtns: number
  }>()

  for (const row of raw) {
    if (!row.ts) continue
    const date = new Date(row.ts)
    if (isNaN(date.getTime())) continue
    const ms = row.ms_played ?? 0
    const hours = ms / 3_600_000
    const artist = row.artist_name ?? 'Unknown'
    const track = row.track_name ?? 'Unknown'
    const dayName = DAY_NAMES[date.getUTCDay()]
    const hour = date.getUTCHours()
    const ym = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

    const day = dayMap.get(dayName)!
    day.total_hours += hours
    day.total_plays += 1

    const h = hourMap.get(hour)!
    h.total_hours += hours
    h.total_streams += 1

    const m = monthMap.get(ym) ?? { total_hours: 0, total_streams: 0 }
    m.total_hours += hours
    m.total_streams += 1
    monthMap.set(ym, m)

    const a = artistMap.get(artist) ?? { total_hours: 0, total_plays: 0, skips: 0 }
    a.total_hours += hours
    a.total_plays += 1
    if (row.reason_end === 'fwdbtn') a.skips += 1
    artistMap.set(artist, a)

    const key = `${track}|||${artist}`
    const t = trackMap.get(key) ?? { artist_name: artist, track_name: track, total_plays: 0, total_ms: 0, skips: 0, backbtns: 0 }
    t.total_plays += 1
    t.total_ms += ms
    if (row.reason_end === 'fwdbtn') t.skips += 1
    if (row.reason_end === 'backbtn') t.backbtns += 1
    trackMap.set(key, t)
  }

  const topArtists: TopArtist[] = Array.from(artistMap.entries())
    .map(([artist_name, v]) => ({
      artist_name,
      total_plays: v.total_plays,
      total_hours: v.total_hours,
      skip_rate: v.total_plays > 0 ? v.skips / v.total_plays : 0,
    }))
    .sort((a, b) => b.total_plays - a.total_plays)

  const monthlyStats: MonthlyStats[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year_month, v]) => ({
      year_month,
      total_hours_played: v.total_hours,
      total_streams: v.total_streams,
    }))

  const dayOfWeekStats: DayOfWeekStat[] = ORDERED_DAYS.map((d) => ({
    day_of_week: d,
    total_hours: dayMap.get(d)?.total_hours ?? 0,
    total_plays: dayMap.get(d)?.total_plays ?? 0,
  }))

  const hourlyHabits: HourlyHabit[] = Array.from(hourMap.entries()).map(([hour_of_day, v]) => ({
    hour_of_day,
    total_hours_played: v.total_hours,
    total_streams: v.total_streams,
  }))

  const skipBehavior: SkipBehavior[] = Array.from(trackMap.values())
    .map((v) => ({
      track_name: v.track_name,
      artist_name: v.artist_name,
      play_count: v.total_plays,
      skip_count: v.skips,
      avg_duration: v.total_plays > 0 ? v.total_ms / v.total_plays : 0,
      skip_percentage: v.total_plays > 0 ? v.skips / v.total_plays : 0,
    }))
    .sort((a, b) => b.skip_count - a.skip_count)

  const loopTracks: LoopTrack[] = Array.from(trackMap.values())
    .map((v) => ({
      track_name: v.track_name,
      artist_name: v.artist_name,
      loop_count: v.backbtns,
    }))
    .filter((t) => t.loop_count > 0)
    .sort((a, b) => b.loop_count - a.loop_count)

  const topSongs: TopSong[] = Array.from(trackMap.values())
    .map((v) => ({
      track_name: v.track_name,
      artist_name: v.artist_name,
      total_plays: v.total_plays,
      total_hours: v.total_ms / 3_600_000,
    }))
    .sort((a, b) => b.total_plays - a.total_plays)

  return { topArtists, topSongs, monthlyStats, dayOfWeekStats, hourlyHabits, skipBehavior, loopTracks }
}

interface DashboardProps {
  spotifyUser: SpotifyUserProfile | null
  artistOrigins: ArtistOrigin[] | null
}

export default function Dashboard({ spotifyUser, artistOrigins }: DashboardProps) {
  const [loading, setLoading] = useState(true)
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [filters, setFilters] = useState<DashboardFilters>({})
  const [fetchProgress, setFetchProgress] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const allRows: RawRow[] = []
      const batchSize = 10000
      let lastTs: string | null = null

      // eslint-disable-next-line no-constant-condition
      while (true) {
        let query = supabase
          .from('listening_history')
          .select('ts, ms_played, artist_name, track_name, reason_end')
          .order('ts', { ascending: false })
          .limit(batchSize)

        if (lastTs) {
          query = query.lt('ts', lastTs)
        }

        const { data, error } = await query

        if (error) {
          console.error('Batch fetch error:', error)
          break
        }
        if (!data || data.length === 0) break
        allRows.push(...(data as RawRow[]))
        lastTs = data[data.length - 1].ts
        setFetchProgress(Math.min(Math.round((allRows.length / 92000) * 100), 100))
        if (data.length < batchSize) break
      }

      if (!cancelled) {
        setRawRows(allRows)
        setLoading(false)
      }
    }

    loadData()

    // Re-fetch data every 2 minutes to pick up new synced rows
    const refreshInterval = setInterval(() => {
      if (!cancelled) loadData()
    }, 2 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(refreshInterval)
    }
  }, [])

  const onFilterChange = useCallback((newFilter: Partial<DashboardFilters>) => {
    setFilters((prev) => {
      const next = { ...prev }
      for (const [key, value] of Object.entries(newFilter)) {
        const k = key as keyof DashboardFilters
        if (next[k] === value) {
          delete next[k]
        } else {
          ;(next as Record<string, unknown>)[k] = value
        }
      }
      return next
    })
  }, [])

  const clearFilters = useCallback(() => setFilters({}), [])

  const hasActiveFilters = Object.keys(filters).length > 0

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    for (const row of rawRows) {
      if (!row.ts) continue
      const d = new Date(row.ts)
      if (isNaN(d.getTime())) continue
      years.add(String(d.getUTCFullYear()))
    }
    return Array.from(years).sort().reverse()
  }, [rawRows])

  const filteredRows = useMemo(() => filterRows(rawRows, filters.year, filters.artist), [rawRows, filters.year, filters.artist])

  const computed = useMemo(() => computeAll(filteredRows), [filteredRows])

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const trendData = useMemo(() => {
    if (!computed.monthlyStats) return null
    if (filters.year) {
      return computed.monthlyStats.map((m) => {
        const monthNum = parseInt(m.year_month.slice(5), 10) - 1
        return { ...m, label: MONTH_NAMES[monthNum] ?? m.year_month.slice(5) }
      })
    }
    return computed.monthlyStats.map((m) => ({
      ...m,
      label: m.year_month,
    }))
  }, [computed.monthlyStats, filters.year])

  const totalRecords = filteredRows.length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="w-72 text-center">
          <div className="flex justify-center mb-5">
            <MusicBars />
          </div>
          <p className="mb-4 text-sm font-medium text-zinc-300">Fetching data...</p>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${fetchProgress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-zinc-500">{fetchProgress}%</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <AIRemarkBanner
          topArtists={computed.topArtists}
          artistOrigins={artistOrigins}
          totalRecords={totalRecords}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          spotifyUser={spotifyUser}
        />

        <NowPlaying />

        {availableYears.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-zinc-400">Year:</span>

              <div className="flex flex-wrap items-center gap-1.5">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => onFilterChange({ year })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      filters.year === year
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10'
                        : 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700/60'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <>
                  <div className="h-4 w-px bg-zinc-700" />
                  <button
                    onClick={clearFilters}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-700/60 hover:text-white"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>

            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {filters.artist && (
                  <button
                    onClick={() => onFilterChange({ artist: filters.artist })}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    {filters.artist}
                    <span className="ml-0.5 text-emerald-500">&times;</span>
                  </button>
                )}
                {filters.dayOfWeek && (
                  <button
                    onClick={() => onFilterChange({ dayOfWeek: filters.dayOfWeek })}
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
                  >
                    {filters.dayOfWeek}
                    <span className="ml-0.5 text-cyan-500">&times;</span>
                  </button>
                )}
                {filters.hour != null && (
                  <button
                    onClick={() => onFilterChange({ hour: filters.hour })}
                    className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/20"
                  >
                    {filters.hour}:00
                    <span className="ml-0.5 text-violet-500">&times;</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <KPICards
          topArtists={computed.topArtists}
          topSongs={computed.topSongs}
          isFiltered={hasActiveFilters}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopArtistsList
            data={computed.topArtists}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
          <TopSongsList
            data={computed.topSongs}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
        </div>

        <ListeningTrend
          data={trendData}
          activeFilters={filters}
          onFilterChange={onFilterChange}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ListeningDaysChart
            data={computed.dayOfWeekStats}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
          <HourlyProfileChart
            data={computed.hourlyHabits}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LoopedTracks
            data={computed.loopTracks}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
          <SkippedTracks
            data={computed.skipBehavior}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
        </div>

        <ArtistOriginsMap
          origins={artistOrigins}
          topArtists={computed.topArtists}
          activeFilters={filters}
          onFilterChange={onFilterChange}
        />

        <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-600">
          Dabioluwa® 2026
        </footer>
      </div>
    </main>
  )
}
