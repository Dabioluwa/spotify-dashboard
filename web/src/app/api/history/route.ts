import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { success: false, error: "Missing Supabase Environment Variables in .env.local" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    // Add a 5-second timeout so it never spins infinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const { data: tracks, count, error } = await supabase
      .from('listening_history')
      .select('*', { count: 'exact' })
      .limit(10)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      total_listening_records: count,
      sample_tracks: tracks,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.name === 'AbortError' ? 'Database connection timed out' : err.message },
      { status: 500 }
    );
  }
}