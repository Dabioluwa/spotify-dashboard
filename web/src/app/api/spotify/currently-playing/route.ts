import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('spotify_access_token')?.value
  if (cookieToken) return cookieToken

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

export async function GET() {
  const token = await getToken()

  if (!token) {
    return NextResponse.json({ is_playing: false, error: 'not_connected' }, { status: 401 })
  }

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (res.status === 204 || res.status === 202) {
      return NextResponse.json({ is_playing: false })
    }

    if (!res.ok) {
      return NextResponse.json({ is_playing: false, error: res.status })
    }

    const data = await res.json()

    if (!data || !data.item) {
      return NextResponse.json({ is_playing: false })
    }

    return NextResponse.json({
      is_playing: data.is_playing,
      progress_ms: data.progress_ms,
      server_now: Date.now(),
      track: {
        name: data.item.name,
        artists: data.item.artists.map((a: { name: string }) => a.name).join(', '),
        album: data.item.album.name,
        album_art: data.item.album.images?.[0]?.url ?? null,
        duration_ms: data.item.duration_ms,
        external_url: data.item.external_urls?.spotify ?? null,
      },
    })
  } catch {
    return NextResponse.json({ is_playing: false, error: 'fetch_failed' })
  }
}
