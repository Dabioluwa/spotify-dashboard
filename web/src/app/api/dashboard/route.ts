import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ORDERED_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface RawRow {
  played_at: string | null
  ms_played: number | null
  artist_name: string | null
  track_name: string | null
  reason_end: string | null
}

function computeAll(raw: RawRow[]) {
  const dayMap = new Map<string, { total_hours: number; total_plays: number }>()
  ORDERED_DAYS.forEach((d) => dayMap.set(d, { total_hours: 0, total_plays: 0 }))

  const hourMap = new Map<number, { total_hours: number; total_streams: number }>()
  for (let h = 0; h < 24; h++) hourMap.set(h, { total_hours: 0, total_streams: 0 })

  const monthMap = new Map<string, { total_hours: number; total_streams: number }>()
  const artistMap = new Map<string, { total_hours: number; total_plays: number; skips: number }>()
  const trackMap = new Map<string, {
    artist_name: string
    track_name: string
    total_plays: number
    total_ms: number
    skips: number
    backbtns: number
  }>()

  for (const row of raw) {
    if (!row.played_at) continue
    const date = new Date(row.played_at)
    if (isNaN(date.getTime())) continue
    const ms = row.ms_played ?? 0
    const hours = ms / 3_600_000
    const artist = row.artist_name ?? 'Unknown'
    const track = row.track_name ?? 'Unknown'
    const dayName = DAY_NAMES[date.getUTCDay()]
    const hour = date.getUTCHours()
    const ym = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

    const day = dayMap.get(dayName)!
    day.total_hours += hours
    day.total_plays += 1

    const h = hourMap.get(hour)!
    h.total_hours += hours
    h.total_streams += 1

    const m = monthMap.get(ym) ?? { total_hours: 0, total_streams: 0 }
    m.total_hours += hours
    m.total_streams += 1
    monthMap.set(ym, m)

    const a = artistMap.get(artist) ?? { total_hours: 0, total_plays: 0, skips: 0 }
    a.total_hours += hours
    a.total_plays += 1
    if (row.reason_end === 'fwdbtn') a.skips += 1
    artistMap.set(artist, a)

    const key = `${track}|||${artist}`
    const t = trackMap.get(key) ?? { artist_name: artist, track_name: track, total_plays: 0, total_ms: 0, skips: 0, backbtns: 0 }
    t.total_plays += 1
    t.total_ms += ms
    if (row.reason_end === 'fwdbtn') t.skips += 1
    if (row.reason_end === 'backbtn') t.backbtns += 1
    trackMap.set(key, t)
  }

  const topArtists = Array.from(artistMap.entries())
    .map(([artist_name, v]) => ({
      artist_name,
      total_plays: v.total_plays,
      total_hours: v.total_hours,
      skip_rate: v.total_plays > 0 ? v.skips / v.total_plays : 0,
    }))
    .sort((a, b) => b.total_plays - a.total_plays)

  const monthlyStats = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year_month, v]) => ({
      year_month,
      total_hours_played: v.total_hours,
      total_streams: v.total_streams,
    }))

  const dayOfWeekStats = ORDERED_DAYS.map((d) => ({
    day_of_week: d,
    total_hours: dayMap.get(d)?.total_hours ?? 0,
    total_plays: dayMap.get(d)?.total_plays ?? 0,
  }))

  const hourlyHabits = Array.from(hourMap.entries()).map(([hour_of_day, v]) => ({
    hour_of_day,
    total_hours_played: v.total_hours,
    total_streams: v.total_streams,
  }))

  const skipBehavior = Array.from(trackMap.values())
    .map((v) => ({
      track_name: v.track_name,
      artist_name: v.artist_name,
      play_count: v.total_plays,
      skip_count: v.skips,
      avg_duration: v.total_plays > 0 ? v.total_ms / v.total_plays : 0,
      skip_percentage: v.total_plays > 0 ? v.skips / v.total_plays : 0,
    }))
    .sort((a, b) => b.skip_count - a.skip_count)

  const loopTracks = Array.from(trackMap.values())
    .map((v) => ({
      track_name: v.track_name,
      artist_name: v.artist_name,
      loop_count: v.backbtns,
    }))
    .filter((t) => t.loop_count > 0)
    .sort((a, b) => b.loop_count - a.loop_count)

  const topSongs = Array.from(trackMap.values())
    .map((v) => ({
      track_name: v.track_name,
      artist_name: v.artist_name,
      total_plays: v.total_plays,
      total_hours: v.total_ms / 3_600_000,
    }))
    .sort((a, b) => b.total_plays - a.total_plays)

  return { topArtists, topSongs, monthlyStats, dayOfWeekStats, hourlyHabits, skipBehavior, loopTracks }
}

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year')
  const artist = request.nextUrl.searchParams.get('artist')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const allRows: RawRow[] = []
  let offset = 0
  const batchSize = 1000

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listening_history?select=played_at,ms_played,artist_name,track_name,reason_end&order=played_at.desc&offset=${offset}&limit=${batchSize}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }
    )
    if (!res.ok) break
    const data: RawRow[] = await res.json()
    if (!data || data.length === 0) break
    allRows.push(...data)
    offset += data.length
    if (data.length < batchSize) break
  }

  let filtered = allRows

  if (year) {
    filtered = filtered.filter((row) => {
      if (!row.played_at) return false
      return String(new Date(row.played_at).getUTCFullYear()) === year
    })
  }

  if (artist) {
    filtered = filtered.filter((row) => row.artist_name === artist)
  }

  const result = computeAll(filtered)
  const totalRecords = filtered.length

  const years = new Set<string>()
  for (const row of allRows) {
    if (!row.played_at) continue
    const d = new Date(row.played_at)
    if (isNaN(d.getTime())) continue
    years.add(String(d.getUTCFullYear()))
  }

  return NextResponse.json({
    ...result,
    totalRecords,
    availableYears: Array.from(years).sort().reverse(),
  })
}
