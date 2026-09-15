import glob
import json
import os
from supabase import create_client, Client

# Supabase Credentials
SUPABASE_URL = "https://uzomnwwqelzxknlinflw.supabase.co"

SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6b21ud3dxZWx6eGtubGluZmx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTIzOTI4NSwiZXhwIjoyMTA0ODE1Mjg1fQ.J7-hoPZFGTteu7dzS6dudIRoitVUzj2X3qglalfQF7A"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BATCH_SIZE = 1000  # Chunks records to prevent PostgREST payload limits


def parse_file(file_path: str) -> list[dict]:
    """Parses a Spotify JSON file (Extended or Account Data)

    and standardizes records for insertion into Supabase.
    """
    records = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            return records

        for item in data:
            # 1. Extended Streaming History Format (Endsong_*.json)
            if "ts" in item:
                ms_played = item.get("ms_played", 0)
                record = {
                    "played_at": item.get("ts"),
                    "track_name": item.get("master_metadata_track_name"),
                    "artist_name": item.get(
                        "master_metadata_album_artist_name"
                    ),
                    "album_name": item.get("master_metadata_album_album_name"),
                    "spotify_track_uri": item.get("spotify_track_uri"),
                    "ms_played": ms_played,
                    "track_duration_ms": ms_played,  # Extended logs log exact played time
                    "platform": item.get("platform"),
                    "reason_start": item.get("reason_start"),
                    "reason_end": item.get("reason_end"),
                    "skipped": item.get("skipped", False),
                    "shuffle": item.get("shuffle", False),
                    "is_inferred": False,  # True native telemetry
                }

            # 2. Account Data / 1-Year Simple Format (StreamingHistory_*.json)
            elif "endTime" in item:
                ms_played = item.get("msPlayed", 0)
                played_at_iso = f"{item.get('endTime')}:00Z".replace(" ", "T")
                artist = item.get("artistName", "")
                track = item.get("trackName", "")
                end_time = item.get("endTime", "")

                record = {
                    "played_at": played_at_iso,
                    "track_name": track,
                    "artist_name": artist,
                    "album_name": None,
                    "spotify_track_uri": f"legacy:{artist}:{track}:{end_time}",
                    "ms_played": ms_played,
                    "track_duration_ms": ms_played,
                    "platform": None,
                    "reason_start": None,
                    "reason_end": None,
                    "skipped": True if ms_played < 30000 else False,
                    "shuffle": False,
                    "is_inferred": True,  # Estimated metrics
                }
            else:
                continue

            # Ensure minimal required string fields exist before appending
            if record.get("track_name") and record.get("artist_name"):
                records.append(record)

    except Exception as e:
        print(f"⚠️ Error reading {os.path.basename(file_path)}: {e}")

    return records


def upload_in_batches(records: list[dict]):
    """Uploads accumulated records in chunks of BATCH_SIZE using upsert."""
    total_records = len(records)
    print(f"\n🚀 Total valid records collected: {total_records}")
    print(
        f"Uploading in chunks of {BATCH_SIZE} using unique constraint (spotify_track_uri, played_at)..."
    )

    for i in range(0, total_records, BATCH_SIZE):
        chunk = records[i : i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total_records + BATCH_SIZE - 1) // BATCH_SIZE

        try:
            supabase.table("listening_history").upsert(
                chunk, on_conflict="spotify_track_uri, played_at"
            ).execute()
            print(
                f"  ✓ Uploaded batch {batch_num}/{total_batches} ({len(chunk)} rows)"
            )
        except Exception as e:
            print(f"  ❌ Error uploading batch {batch_num}: {e}")


def process_directory(data_dir: str):
    """Scans directory for all .json files and batch inserts them."""
    json_files = glob.glob(os.path.join(data_dir, "*.json"))

    if not json_files:
        print(f"No .json files found in: {data_dir}")
        return

    print(f"Found {len(json_files)} JSON file(s) in {data_dir}")
    all_records = []

    for file_path in json_files:
        print(f"Parsing {os.path.basename(file_path)}...")
        file_records = parse_file(file_path)
        all_records.extend(file_records)
        print(f"  -> Extracted {len(file_records)} valid records")

    if all_records:
        upload_in_batches(all_records)
    else:
        print("No valid listening records extracted.")


if __name__ == "__main__":
    data_directory = r"C:\Users\onash\Documents\Project\spty\Data"
    process_directory(data_directory)