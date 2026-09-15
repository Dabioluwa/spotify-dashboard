'use client'

import type { TopSong, DashboardFilters } from '@/lib/types'

interface TopSongsListProps {
  data: TopSong[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
}

export default function TopSongsList({ data, activeFilters, onFilterChange }: TopSongsListProps) {
  const top5 = data?.slice(0, 5) ?? []
  const maxPlays = top5.length > 0 ? Math.max(...top5.map((s) => s.total_plays ?? 0)) : 1
  const activeArtist = activeFilters?.artist

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Top Songs by Play Count</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Top 5</span>
      </div>

      {top5.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
          No data available
        </div>
      ) : (
        <div className="space-y-3">
          {top5.map((song, i) => {
            const pct = ((song.total_plays ?? 0) / maxPlays) * 100
            const isActive = activeArtist === song.artist_name
            const isDimmed = activeArtist && !isActive
            return (
              <div
                key={song.track_name + song.artist_name}
                className={`group cursor-pointer rounded-lg p-1 -m-1 transition-all ${
                  isDimmed ? 'opacity-30' : 'opacity-100'
                } ${isActive ? 'bg-teal-500/5' : 'hover:bg-zinc-800/30'}`}
                onClick={() => onFilterChange?.({ artist: song.artist_name })}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-teal-500 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className={`block text-sm font-medium truncate max-w-[180px] ${
                        isActive ? 'text-teal-400' : 'text-white'
                      }`}>
                        {song.track_name}
                      </span>
                      <span className="block text-xs text-zinc-500 truncate max-w-[180px]">
                        {song.artist_name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-zinc-400">
                    {song.total_plays?.toLocaleString()} plays
                  </span>
                </div>
                <div className="ml-7.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-400 to-teal-300'
                        : 'bg-gradient-to-r from-teal-500 to-teal-400'
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
