'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Music, ExternalLink } from 'lucide-react'

interface NowPlayingData {
  is_playing: boolean
  progress_ms?: number
  server_now?: number
  track?: {
    name: string
    artists: string
    album: string
    album_art: string | null
    duration_ms: number
    external_url: string | null
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function NowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null)
  const [tick, setTick] = useState(0)
  const fetchedAtRef = useRef(Date.now())
  const progressMsRef = useRef(0)

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/currently-playing', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
        progressMsRef.current = json.progress_ms ?? 0
        fetchedAtRef.current = json.server_now ?? Date.now()
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 10000)
    return () => clearInterval(interval)
  }, [fetchNowPlaying])

  useEffect(() => {
    if (!data?.is_playing) return
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [data?.is_playing])

  if (!data?.track) return null

  const { track, is_playing } = data
  const elapsed = is_playing ? Date.now() - fetchedAtRef.current : 0
  const progress = progressMsRef.current + elapsed
  const pct = track.duration_ms > 0 ? Math.min((progress / track.duration_ms) * 100, 100) : 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Now Playing</h3>
        </div>
        {is_playing && (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              Playing
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {track.album_art ? (
          <img
            src={track.album_art}
            alt={track.album}
            className={`h-14 w-14 rounded-lg object-cover shadow-lg ${
              is_playing ? 'ring-2 ring-emerald-500/40' : ''
            }`}
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-800">
            <Music className="h-6 w-6 text-zinc-600" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">
            {track.name}
          </div>
          <div className="truncate text-xs text-zinc-400">
            {track.artists}
          </div>
          <div className="truncate text-[10px] text-zinc-500">
            {track.album}
          </div>
        </div>

        {track.external_url && (
          <a
            href={track.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
            title="Open in Spotify"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="mt-3">
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(track.duration_ms)}</span>
        </div>
      </div>
    </div>
  )
}
