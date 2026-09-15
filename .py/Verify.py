from supabase import create_client, Client

SUPABASE_URL = "https://uzomnwwqelzxknlinflw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6b21ud3dxZWx6eGtubGluZmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzkyODUsImV4cCI6MjEwNDgxNTI4NX0.6NxA5-Z1Bab-8jluc73AlQ4ss5vvjGNN9TC16uC2Gyo"  # Replace with your eyJ... key

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def verify_database():
    # 1. Fetch total count of records
    count_response = (
        supabase.table("listening_history")
        .select("*", count="exact")
        .execute()
    )
    print(f"Total Rows in Database: {len(count_response.data)}")

    # 2. Query top played tracks from mock data
    print("\n--- Top Streams in Database ---")
    response = (
        supabase.table("listening_history")
        .select("track_name, artist_name, ms_played, played_at")
        .order("played_at", desc=True)
        .limit(5)
        .execute()
    )

    for record in response.data:
        minutes = round(record["ms_played"] / 60000, 2)
        print(
            f"• {record['track_name']} by {record['artist_name']} ({minutes} mins) - Played at: {record['played_at']}"
        )


if __name__ == "__main__":
    verify_database()