const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function fetchRecentlyPlayed(token, afterCursor) {
  const url = new URL("https://api.spotify.com/v1/me/player/recently-played");
  url.searchParams.set("limit", "50");
  if (afterCursor) url.searchParams.set("after", afterCursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

async function getRecentExistingRows() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listening_history?select=played_at,spotify_track_uri&order=played_at.desc&limit=300`,
    { headers }
  );
  if (!res.ok) return [];
  return res.json();
}

async function insertRows(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/listening_history`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert error: ${err}`);
  }
}

function normalizeTs(ts) {
  // Normalize timezone: "+00:00" -> "Z", and truncate milliseconds
  return ts
    .replace(/\.\d+/, "")      // remove milliseconds
    .replace(/\+00:00$/, "Z")  // normalize UTC timezone
    .replace(/Z$/, "Z");       // keep Z as-is
}

function dedupKey(playedAt, uri) {
  return `${normalizeTs(playedAt)}|||${uri}`;
}

async function main() {
  console.log("Starting Spotify sync...");
  const token = await getSpotifyToken();
  console.log("Got Spotify token");

  let totalInserted = 0;
  let afterCursor = undefined;
  const MAX_PAGES = 5;

  // Fetch recent rows from DB to build dedup set
  const recentRows = await getRecentExistingRows();
  const existingSet = new Set(
    recentRows.map((r) => dedupKey(r.played_at, r.spotify_track_uri))
  );
  console.log(`Dedup set: ${existingSet.size} recent rows`);

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await fetchRecentlyPlayed(token, afterCursor);
    if (!data.items || data.items.length === 0) break;

    const newRows = data.items
      .filter((item) => !existingSet.has(dedupKey(item.played_at, item.track.uri)))
      .map((item) => ({
        ts: item.played_at,
        ms_played: item.track.duration_ms,
        track_name: item.track.name,
        artist_name: item.track.artists.map((a) => a.name).join(", "),
        album_name: item.track.album.name,
        spotify_track_uri: item.track.uri,
        reason_start: "api_sync",
        reason_end: null,
        shuffle: null,
        skipped: null,
        offline: false,
      }));

    if (newRows.length === 0) {
      console.log(`Page ${page + 1}: all ${data.items.length} tracks already exist, stopping.`);
      break;
    }

    await insertRows(newRows);
    totalInserted += newRows.length;
    console.log(`Page ${page + 1}: inserted ${newRows.length} of ${data.items.length} tracks`);

    afterCursor = data.cursors?.after;
    if (!afterCursor) break;
  }

  console.log(`Sync complete. Total inserted: ${totalInserted}`);
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
