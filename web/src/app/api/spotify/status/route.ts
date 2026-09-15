import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('spotify_access_token')?.value ?? null

  if (!token) {
    return NextResponse.json({ has_token: false })
  }

  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ has_token: true, spotify_status: res.status, error: await res.text() })
  }

  const user = await res.json()
  return NextResponse.json({ has_token: true, spotify_status: 200, user: user.display_name })
}
