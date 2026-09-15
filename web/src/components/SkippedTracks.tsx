'use client'

import { SkipForward } from 'lucide-react'
import type { SkipBehavior, DashboardFilters } from '@/lib/types'

interface SkippedTracksProps {
  data: SkipBehavior[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
}

export default function SkippedTracks({ data, activeFilters, onFilterChange }: SkippedTracksProps) {
  const top5 = data?.slice(0, 5) ?? []
  const activeArtist = activeFilters?.artist

  const maxSkips = top5.length > 0 ? Math.max(...top5.map((t) => t.skip_count)) : 1

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Most Skipped Tracks</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Skip Count</span>
      </div>

      {top5.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
          No skip data available
        </div>
      ) : (
        <div className="space-y-2.5">
          {top5.map((track, i) => {
            const barWidth = maxSkips > 0 ? (track.skip_count / maxSkips) * 100 : 0
            const isHigh = track.skip_count > maxSkips * 0.7
            const isMed = track.skip_count > maxSkips * 0.35
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
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh
                          ? 'bg-red-500'
                          : isMed
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isHigh
                        ? 'bg-red-500/15 text-red-400'
                        : isMed
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    <SkipForward className="h-2.5 w-2.5" />
                    {track.skip_count}x
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
