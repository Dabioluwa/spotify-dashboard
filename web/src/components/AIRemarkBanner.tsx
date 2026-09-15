'use client'

import { Activity, Music, BarChart3, X, LogIn } from 'lucide-react'
import type { TopArtist, ArtistOrigin, SpotifyUserProfile } from '@/lib/types'

interface AIRemarkBannerProps {
  topArtists: TopArtist[] | null
  artistOrigins: ArtistOrigin[] | null
  totalRecords: number
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  spotifyUser?: SpotifyUserProfile | null
}

export default function AIRemarkBanner({ topArtists, artistOrigins, totalRecords, hasActiveFilters, onClearFilters, spotifyUser }: AIRemarkBannerProps) {
  const artistCount = topArtists?.length ?? 0

  const profileImage = spotifyUser?.images?.[0]?.url

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-zinc-900/80 p-6 md:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-teal-500/5 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Dabioluwa's Spotify Listening Analytics
              </h1>
              <p className="text-sm text-zinc-400">Listening Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700/80 hover:text-white"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}

            {spotifyUser ? (
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={spotifyUser.display_name}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover ring-2 ring-emerald-500/40"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    {spotifyUser.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-xs font-medium text-zinc-300">
                  {spotifyUser.display_name}
                </span>
              </div>
            ) : (
              <button
                onClick={() => { window.location.href = '/api/spotify/login' }}
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/25 hover:text-emerald-300"
              >
                <LogIn className="h-3 w-3" />
                Connect Spotify
              </button>
            )}
          </div>
        </div>

        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
          {spotifyUser ? (
            <>
              Welcome back, <span className="font-semibold text-emerald-400">{spotifyUser.display_name}</span>.{' '}
            </>
          ) : null}
          Tracking your musical journey across{' '}
          <span className="font-semibold text-emerald-400">{artistCount} artists</span>,
          analyzing{' '}
          <span className="font-semibold text-emerald-400">{totalRecords.toLocaleString()}</span>{' '}
          listening records.
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Data
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-300">
            <Music className="h-3 w-3" />
            {artistCount} Artists
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-300">
            <BarChart3 className="h-3 w-3" />
            {totalRecords.toLocaleString()} Records
          </span>
        </div>
      </div>
    </div>
  )
}
