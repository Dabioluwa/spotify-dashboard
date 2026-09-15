import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getSpotifyToken(): Promise<string | null> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
  if (!refreshToken) return null

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

interface SpotifyTrack {
  name: string
  artists: { name: string }[]
  album: { name: string }
  uri: string
  duration_ms: number
}

interface SpotifyHistoryItem {
  played_at: string
  track: SpotifyTrack
}

interface SpotifyRecentlyPlayedResponse {
  items: SpotifyHistoryItem[]
  cursors?: { after?: string; before?: string }
}

export async function POST() {
  const token = await getSpotifyToken()
  if (!token) {
    return NextResponse.json({ error: 'Not connected to Spotify' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let totalInserted = 0
  let totalSkipped = 0
  const errors: string[] = []

  let afterCursor: string | undefined = undefined
  const MAX_PAGES = 5

  // Fetch recent rows from DB to build dedup set (avoids broken 'in' filter with timestamps)
  const { data: recentRows } = await supabase
    .from('listening_history')
    .select('played_at, spotify_track_uri')
    .order('played_at', { ascending: false })
    .limit(300)

  const existingSet = new Set(
    (recentRows ?? []).map((r) => {
      // Normalize: truncate milliseconds, convert +00:00 to Z
      const normalized = r.played_at
        .replace(/\.\d+/, '')
        .replace(/\+00:00$/, 'Z')
      return `${normalized}|||${r.spotify_track_uri}`
    })
  )

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL('https://api.spotify.com/v1/me/player/recently-played')
    url.searchParams.set('limit', '50')
    if (afterCursor) {
      url.searchParams.set('after', afterCursor)
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 204 || res.status === 202) break
      errors.push(`Spotify API error: ${res.status}`)
      break
    }

    const data: SpotifyRecentlyPlayedResponse = await res.json()
    if (!data.items || data.items.length === 0) break

    const newRows = data.items
      .filter((item) => {
        const normalized = item.played_at
          .replace(/\.\d+/, '')
          .replace(/\+00:00$/, 'Z')
        const key = `${normalized}|||${item.track.uri}`
        return !existingSet.has(key)
      })
      .map((item) => ({
        ts: item.played_at,
        ms_played: item.track.duration_ms,
        track_name: item.track.name,
        artist_name: item.track.artists.map((a) => a.name).join(', '),
        album_name: item.track.album.name,
        spotify_track_uri: item.track.uri,
        reason_start: 'api_sync',
        reason_end: null,
        shuffle: null,
        skipped: null,
        offline: false,
      }))

    if (newRows.length === 0) break

    const { error: insertError } = await supabase
      .from('listening_history')
      .insert(newRows)

    if (insertError) {
      errors.push(`Insert error: ${insertError.message}`)
      break
    }

    totalInserted += newRows.length
    totalSkipped += data.items.length - newRows.length

    afterCursor = data.cursors?.after
    if (!afterCursor) break
  }

  return NextResponse.json({
    inserted: totalInserted,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : undefined,
  })
}
