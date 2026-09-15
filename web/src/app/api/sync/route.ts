import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRecentlyPlayed } from '@/lib/spotify';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const response = await getRecentlyPlayed();

    if (response.status !== 200) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message || 'Spotify API error' }, { status: response.status });
    }

    const { items } = await response.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'No recent tracks found.' });
    }

    // Format Spotify track objects for Supabase insertion
    const records = items.map((item: any) => ({
      ts: item.played_at,
      ms_played: item.track.duration_ms,
      track_name: item.track.name,
      artist_name: item.track.artists[0]?.name,
      album_name: item.track.album?.name,
      spotify_track_uri: item.track.uri,
      reason_start: null,
      reason_end: null,
      shuffle: false,
      skipped: false,
      offline: false,
    }));

    // Upsert items ignoring records that match on unique constraint (spotify_track_uri, ts)
    const { data, error } = await supabase
      .from('listening_history')
      .upsert(records, { onConflict: 'spotify_track_uri, ts', ignoreDuplicates: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      processed: records.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}