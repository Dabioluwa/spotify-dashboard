export interface TopArtist {
  artist_name: string
  total_plays: number
  total_hours: number
  skip_rate: number
}

export interface TopSong {
  track_name: string
  artist_name: string
  total_plays: number
  total_hours: number
}

export interface MonthlyStats {
  year_month: string
  total_streams: number
  total_hours_played: number
}

export interface SkipBehavior {
  track_name: string
  artist_name: string
  play_count: number
  skip_count: number
  avg_duration: number
  skip_percentage: number
}

export interface LoopTrack {
  track_name: string
  artist_name: string
  loop_count: number
}

export interface HourlyHabit {
  hour_of_day: number
  total_streams: number
  total_hours_played: number
}

export interface ArtistOrigin {
  id: string
  artist_name: string
  origin_city: string | null
  origin_country: string | null
  latitude: number | null
  longitude: number | null
  origin_location: string | null
}

export interface DayOfWeekStat {
  day_of_week: string
  total_hours: number
  total_plays: number
}

export interface DashboardFilters {
  artist?: string
  month?: string
  year?: string
  dayOfWeek?: string
  hour?: number
}

export interface SpotifyUserProfile {
  display_name: string
  images: { url: string; height: number; width: number }[]
  id: string
  email?: string
}
