import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Test: can we even query listening_history without pulling all rows?
  const { count, error: countErr } = await supabase
    .from('listening_history')
    .select('*', { count: 'exact', head: true })

  // Sample a small batch with valid played_at
  const { data: sample, error: sampleErr } = await supabase
    .from('listening_history')
    .select('played_at, ms_played, artist_name, track_name, reason_end')
    .not('played_at', 'is', null)
    .gt('ms_played', 0)
    .order('played_at', { ascending: true })
    .limit(10)

  // Count origins
  const { count: originCount } = await supabase
    .from('artist_origins')
    .select('*', { count: 'exact', head: true })

  // Test month grouping with RPC or just check sample dates
  const sampleDates = sample?.map(r => r.played_at) ?? []

  return NextResponse.json({
    totalRecords: count ?? 0,
    countError: countErr?.message ?? null,
    sampleError: sampleErr?.message ?? null,
    originCount: originCount ?? 0,
    sampleDates,
    sampleMsPlayed: sample?.map(r => r.ms_played) ?? [],
  })
}
