import time
import requests
from supabase import create_client, Client

SUPABASE_URL = "https://uzomnwwqelzxknlinflw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6b21ud3dxZWx6eGtubGluZmx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTIzOTI4NSwiZXhwIjoyMTA0ODE1Mjg1fQ.J7-hoPZFGTteu7dzS6dudIRoitVUzj2X3qglalfQF7A"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
HEADERS = {
    "User-Agent": "SpotifyTelemetryDashboard/1.0 (contact: onashokuntanidabioluwa@gmail.com)"
}


def get_unique_artists() -> list[str]:
    """Retrieve distinct artist names present in listening_history."""
    response = supabase.table("listening_history").select("artist_name").execute()
    artists = list(set([row["artist_name"] for row in response.data if row.get("artist_name")]))
    return artists


def fetch_artist_metadata(artist_name: str):
    """Query MusicBrainz for country/city of origin and genre tags."""
    mb_url = f"https://musicbrainz.org/ws/2/artist/?query=artist:{requests.utils.quote(artist_name)}&fmt=json"
    try:
        res = requests.get(mb_url, headers=HEADERS, timeout=10).json()
        artists = res.get("artists", [])
        if not artists:
            return None, []

        match = artists[0]
        location = match.get("begin-area", {}).get("name") or match.get("area", {}).get("name")
        tags = [tag["name"] for tag in match.get("tags", []) if tag.get("name")]

        return location, tags
    except Exception as e:
        print(f"⚠️ MusicBrainz query error for {artist_name}: {e}")
        return None, []


def geocode_location(location_name: str):
    geo_url = f"https://nominatim.openstreetmap.org/search?q={requests.utils.quote(location_name)}&format=json&limit=1"
    try:
        res = requests.get(geo_url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            data = res.json()
            if data and isinstance(data, list):
                return float(data[0]["lat"]), float(data[0]["lon"])
        else:
            print(f"⚠️ Geocoding status {res.status_code} for: {location_name}")
    except Exception as e:
        print(f"⚠️ Geocoding error for {location_name}: {e}")
    return None, None


def enrich_artists():
    artists = get_unique_artists()
    print(f"Found {len(artists)} unique artists in listening_history...")

    for artist in artists:
        # Avoid duplicate queries if artist already exists in artist_origins
        existing = supabase.table("artist_origins").select("artist_name").eq("artist_name", artist).execute()
        if existing.data:
            continue

        print(f"Enriching: {artist}")
        location, genres = fetch_artist_metadata(artist)

        lat, lon = None, None
        if location:
            lat, lon = geocode_location(location)
            time.sleep(1)  # Respect Nominatim rate limit (1 req/sec)

        # 1. Insert into artist_origins
        if location and lat is not None and lon is not None:
            supabase.table("artist_origins").insert({
                "artist_name": artist,
                "origin_location": location,
                "latitude": lat,
                "longitude": lon
            }).execute()
            print(f"  ✓ Origin: {location} ({lat}, {lon})")

        # 2. Insert into artist_genres
        # Insert into artist_genres using upsert to handle existing records
        if genres:
            genre_rows = [{"artist_name": artist, "genre": g} for g in genres[:5]]
            supabase.table("artist_genres").upsert(genre_rows, on_conflict="artist_name, genre").execute()
            print(f"  ✓ Added/Updated {len(genre_rows)} genres")

        time.sleep(1)  # Respect MusicBrainz rate limit (1 req/sec)

    print("\n🎉 Artist origins and genres enrichment completed!")


if __name__ == "__main__":
    enrich_artists()