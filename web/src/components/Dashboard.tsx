'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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

interface DashboardData {
  topArtists: TopArtist[]
  topSongs: TopSong[]
  monthlyStats: MonthlyStats[]
  dayOfWeekStats: DayOfWeekStat[]
  hourlyHabits: HourlyHabit[]
  skipBehavior: SkipBehavior[]
  loopTracks: LoopTrack[]
  totalRecords: number
  availableYears: string[]
}

interface DashboardProps {
  spotifyUser: SpotifyUserProfile | null
  artistOrigins: ArtistOrigin[] | null
}

export default function Dashboard({ spotifyUser, artistOrigins }: DashboardProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [filters, setFilters] = useState<DashboardFilters>({})
  const [fetchProgress, setFetchProgress] = useState(0)
  const loadCountRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    loadCountRef.current += 1
    const thisLoad = loadCountRef.current

    async function loadData() {
      setFetchProgress(5)

      const progressTimer = setInterval(() => {
        if (cancelled || thisLoad !== loadCountRef.current) return
        setFetchProgress((prev) => Math.min(prev + 3, 90))
      }, 300)

      const params = new URLSearchParams()
      if (filters.year) params.set('year', filters.year)
      if (filters.artist) params.set('artist', filters.artist)

      const url = `/api/dashboard${params.toString() ? `?${params}` : ''}`
      const res = await fetch(url)
      clearInterval(progressTimer)
      if (!res.ok) return
      const json: DashboardData = await res.json()
      if (!cancelled && thisLoad === loadCountRef.current) {
        setFetchProgress(100)
        setData(json)
        setTimeout(() => {
          if (!cancelled && thisLoad === loadCountRef.current) setLoading(false)
        }, 300)
      }
    }

    loadData()

    const refreshInterval = setInterval(() => {
      if (!cancelled) loadData()
    }, 2 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(refreshInterval)
    }
  }, [filters.year, filters.artist])

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

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const trendData = useMemo(() => {
    if (!data?.monthlyStats) return null
    if (filters.year) {
      return data.monthlyStats.map((m) => {
        const monthNum = parseInt(m.year_month.slice(5), 10) - 1
        return { ...m, label: MONTH_NAMES[monthNum] ?? m.year_month.slice(5) }
      })
    }
    return data.monthlyStats.map((m) => ({
      ...m,
      label: m.year_month,
    }))
  }, [data?.monthlyStats, filters.year])

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="w-72 text-center">
          <div className="flex justify-center mb-5">
            <MusicBars />
          </div>
          <p className="mb-4 text-sm font-medium text-zinc-300">Loading dashboard...</p>
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
          topArtists={data.topArtists}
          artistOrigins={artistOrigins}
          totalRecords={data.totalRecords}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          spotifyUser={spotifyUser}
        />

        <NowPlaying />

        {data.availableYears.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-zinc-400">Year:</span>

              <div className="flex flex-wrap items-center gap-1.5">
                {data.availableYears.map((year) => (
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
          topArtists={data.topArtists}
          topSongs={data.topSongs}
          isFiltered={hasActiveFilters}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopArtistsList
            data={data.topArtists}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
          <TopSongsList
            data={data.topSongs}
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
            data={data.dayOfWeekStats}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
          <HourlyProfileChart
            data={data.hourlyHabits}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LoopedTracks
            data={data.loopTracks}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
          <SkippedTracks
            data={data.skipBehavior}
            activeFilters={filters}
            onFilterChange={onFilterChange}
          />
        </div>

        <ArtistOriginsMap
          origins={artistOrigins}
          topArtists={data.topArtists}
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
