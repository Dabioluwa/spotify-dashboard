const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getArtistsNeedingEnrichment() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/artist_origins?select=id,artist_name&origin_country=is.null&limit=50`,
    { headers }
  );
  if (!res.ok) throw new Error(`Fetch artists error: ${res.status}`);
  return res.json();
}

async function lookupArtistOrigin(artistName) {
  try {
    const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:${artistName}`)}&fmt=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SpotifyDashboard/1.0 (https://github.com/user/spotify-dashboard)",
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const artist = data.artists?.[0];
    if (!artist) return null;

    return {
      origin_country: artist.area?.name ?? null,
      origin_city: artist.begin_area?.name ?? null,
    };
  } catch {
    return null;
  }
}

async function updateArtistOrigin(id, origin) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/artist_origins?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      origin_country: origin.origin_country,
      origin_city: origin.origin_city,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Update error for ${id}: ${err}`);
  }
}

async function main() {
  console.log("Starting artist enrichment...");
  const artists = await getArtistsNeedingEnrichment();
  console.log(`Found ${artists.length} artists needing enrichment`);

  if (artists.length === 0) {
    console.log("Nothing to enrich. Done.");
    return;
  }

  let enriched = 0;
  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    console.log(`[${i + 1}/${artists.length}] Looking up: ${artist.artist_name}`);

    const origin = await lookupArtistOrigin(artist.artist_name);
    if (origin && (origin.origin_country || origin.origin_city)) {
      await updateArtistOrigin(artist.id, origin);
      enriched++;
      console.log(`  -> ${origin.origin_city ? origin.origin_city + ", " : ""}${origin.origin_country ?? "unknown"}`);
    } else {
      console.log("  -> No origin found");
    }

    if (i < artists.length - 1) await sleep(1100);
  }

  console.log(`Enrichment complete. Enriched ${enriched}/${artists.length} artists.`);
}

main().catch((err) => {
  console.error("Enrichment failed:", err.message);
  process.exit(1);
});
