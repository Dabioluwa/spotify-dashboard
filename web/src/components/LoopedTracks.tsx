'use client'

import { Repeat } from 'lucide-react'
import type { LoopTrack, DashboardFilters } from '@/lib/types'

interface LoopedTracksProps {
  data: LoopTrack[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
}

export default function LoopedTracks({ data, activeFilters, onFilterChange }: LoopedTracksProps) {
  const top5 = data?.slice(0, 5) ?? []
  const activeArtist = activeFilters?.artist

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Top Looped Tracks</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Manual Restarts</span>
      </div>

      {top5.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
          No loop data available
        </div>
      ) : (
        <div className="space-y-2.5">
          {top5.map((track, i) => {
            const isActive = activeArtist === track.artist_name
            const isDimmed = activeArtist && !isActive
            return (
              <div
                key={track.track_name + track.artist_name}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all cursor-pointer ${
                  isDimmed ? 'opacity-30' : 'opacity-100'
                } ${isActive ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/50'}`}
                onClick={() => onFilterChange?.({ artist: track.artist_name })}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-medium ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                    {track.track_name}
                  </div>
                  <div className="truncate text-xs text-zinc-500">{track.artist_name}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Repeat className="h-2.5 w-2.5" />
                  {track.loop_count}x
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
