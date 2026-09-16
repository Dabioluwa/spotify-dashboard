import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type {
  ArtistOrigin,
  SpotifyUserProfile,
} from '@/lib/types'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

const LISTENING_HISTORY_COLUMNS = 'ts, ms_played, artist_name, track_name, reason_end' as const
const BATCH_SIZE = 10000

async function refreshSpotifyToken(): Promise<string | null> {
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

async function getSpotifyUser(token: string): Promise<SpotifyUserProfile | null> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('spotify_access_token')?.value ?? null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let spotifyUser: SpotifyUserProfile | null = null
  let activeToken = cookieToken

  if (cookieToken) {
    spotifyUser = await getSpotifyUser(cookieToken)
  }

  if (!spotifyUser) {
    const refreshed = await refreshSpotifyToken()
    if (refreshed) {
      activeToken = refreshed
      spotifyUser = await getSpotifyUser(refreshed)
    }
  }

  const { data: originsData } = await supabase
    .from('artist_origins')
    .select('artist_name, origin_city, origin_country, latitude, longitude, origin_location')

  const artistOrigins = (originsData ?? []) as ArtistOrigin[]

  let allRows: { ts: string | null; ms_played: number | null; artist_name: string | null; track_name: string | null; reason_end: string | null }[] = []
  let offset = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from('listening_history')
      .select(LISTENING_HISTORY_COLUMNS)
      .order('ts', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1)

    if (error || !data || data.length === 0) break
    allRows.push(...data)
    offset += data.length
    if (data.length < BATCH_SIZE) break
  }

  return (
    <Dashboard
      spotifyUser={spotifyUser}
      artistOrigins={artistOrigins}
      initialRows={allRows}
    />
  )
}
