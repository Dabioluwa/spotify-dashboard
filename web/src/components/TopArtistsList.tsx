'use client'

import type { TopArtist, DashboardFilters } from '@/lib/types'

interface TopArtistsListProps {
  data: TopArtist[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
}

export default function TopArtistsList({ data, activeFilters, onFilterChange }: TopArtistsListProps) {
  const top5 = data?.slice(0, 5) ?? []
  const maxPlays = top5.length > 0 ? Math.max(...top5.map((a) => a.total_plays ?? 0)) : 1
  const activeArtist = activeFilters?.artist

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Top Artists by Listening Time</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Top 5</span>
      </div>

      {top5.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
          No data available
        </div>
      ) : (
        <div className="space-y-4">
          {top5.map((artist, i) => {
            const pct = ((artist.total_plays ?? 0) / maxPlays) * 100
            const hours = (artist.total_hours ?? 0).toFixed(1)
            const isActive = activeArtist === artist.artist_name
            const isDimmed = activeArtist && !isActive
            return (
              <div
                key={artist.artist_name}
                className={`group cursor-pointer rounded-lg p-1 -m-1 transition-all ${
                  isDimmed ? 'opacity-30' : 'opacity-100'
                } ${isActive ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/30'}`}
                onClick={() => onFilterChange?.({ artist: artist.artist_name })}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-base font-semibold truncate max-w-[200px] ${
                      isActive ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {artist.artist_name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-zinc-300">{hours}h</span>
                </div>
                <div className="ml-9.5 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-300'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
