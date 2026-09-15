import json
import os
import glob
from supabase import create_client, Client

# Replace with your actual Supabase URL and Key
SUPABASE_URL = "https://uzomnwwqelzxknlinflw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6b21ud3dxZWx6eGtubGluZmx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTIzOTI4NSwiZXhwIjoyMTA0ODE1Mjg1fQ.J7-hoPZFGTteu7dzS6dudIRoitVUzj2X3qglalfQF7A"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
DATA_FOLDER = r"C:\Users\onash\Documents\Project\Spotify Dashboard\Data"


def import_spotify_data():
    json_files = glob.glob(os.path.join(DATA_FOLDER, "*.json"))

    if not json_files:
        print(f"No JSON files found in {DATA_FOLDER}. Put your Spotify JSON files there.")
        return

    print(f"Found {len(json_files)} file(s). Starting import...")

    for file_path in json_files:
        print(f"Processing {file_path}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            records = json.load(f)

        batch = []
        batch_size = 500  # Inserts 500 rows at a time for optimal speed

        for entry in records:
            row = {
                "ts": entry.get("ts"),
                "ms_played": entry.get("ms_played", 0),
                "track_name": entry.get("master_metadata_track_name"),
                "artist_name": entry.get("master_metadata_album_artist_name"),
                "album_name": entry.get("master_metadata_album_album_name"),
                "spotify_track_uri": entry.get("spotify_track_uri"),
                "reason_start": entry.get("reason_start"),
                "reason_end": entry.get("reason_end"),
                "shuffle": entry.get("shuffle"),
                "skipped": entry.get("skipped"),
                "offline": entry.get("offline")
            }

            # Only insert valid track streams
            if row["track_name"] and row["artist_name"]:
                batch.append(row)

            if len(batch) >= batch_size:
                supabase.table("listening_history").insert(batch).execute()
                batch = []

        if batch:
            supabase.table("listening_history").insert(batch).execute()

        print(f"Done: {file_path}")

    print("Import completed successfully!")


if __name__ == "__main__":
    import_spotify_data()