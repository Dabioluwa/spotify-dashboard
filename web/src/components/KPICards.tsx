'use client'

import { Clock, Music, Users, Disc, Filter } from 'lucide-react'
import type { TopArtist, TopSong } from '@/lib/types'

interface KPICardsProps {
  topArtists: TopArtist[] | null
  topSongs: TopSong[] | null
  isFiltered?: boolean
}

interface KPICard {
  label: string
  value: string
  unit: string
  icon: React.ReactNode
  color: string
}

export default function KPICards({ topArtists, topSongs, isFiltered }: KPICardsProps) {
  const totalHours = topArtists
    ? topArtists.reduce((sum, a) => sum + (a.total_hours ?? 0), 0)
    : 0

  const totalSongs = topArtists
    ? topArtists.reduce((sum, a) => sum + (a.total_plays ?? 0), 0)
    : 0

  const artistCount = topArtists?.length ?? 0
  const uniqueSongCount = topSongs?.length ?? 0

  const cards: KPICard[] = [
    {
      label: 'Total Hours',
      value: totalHours.toFixed(1),
      unit: 'hrs',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-emerald-400',
    },
    {
      label: 'Total Plays',
      value: totalSongs.toLocaleString(),
      unit: 'songs',
      icon: <Music className="h-5 w-5" />,
      color: 'text-teal-400',
    },
    {
      label: 'Unique Artists',
      value: String(artistCount),
      unit: 'artists',
      icon: <Users className="h-5 w-5" />,
      color: 'text-cyan-400',
    },
    {
      label: 'Unique Songs',
      value: String(uniqueSongCount),
      unit: 'songs',
      icon: <Disc className="h-5 w-5" />,
      color: 'text-violet-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 ${card.color}`}>
              {card.icon}
            </span>
            <div className="flex items-center gap-1.5">
              {isFiltered && (
                <Filter className="h-3 w-3 text-emerald-400" />
              )}
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {card.unit}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums md:text-3xl">
            {card.value}
          </div>
          <div className="mt-1 text-xs text-zinc-400">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
