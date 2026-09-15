'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps'
import { scaleSqrt } from 'd3-scale'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import type { ArtistOrigin, TopArtist, DashboardFilters } from '@/lib/types'

interface MergedArtist {
  artist_name: string
  latitude: number
  longitude: number
  origin_city: string | null
  origin_country: string | null
  origin_location: string | null
  total_plays: number
  total_hours: number
}

interface ArtistOriginsMapProps {
  origins: ArtistOrigin[] | null
  topArtists: TopArtist[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const DEFAULT_CENTER: [number, number] = [20, 10]
const DEFAULT_ZOOM = 1

export default function ArtistOriginsMap({ origins, topArtists, activeFilters, onFilterChange }: ArtistOriginsMapProps) {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    artist: MergedArtist
  } | null>(null)

  const artistPlayMap = useMemo(() => {
    const map = new Map<string, { total_plays: number; total_hours: number }>()
    for (const a of topArtists ?? []) {
      map.set(a.artist_name, { total_plays: a.total_plays, total_hours: a.total_hours })
    }
    return map
  }, [topArtists])

  const validData = useMemo(() => {
    if (!origins) return []
    return origins
      .filter(
        (d) =>
          d.latitude != null &&
          d.longitude != null &&
          !isNaN(d.latitude) &&
          !isNaN(d.longitude)
      )
      .map((d): MergedArtist => {
        const plays = artistPlayMap.get(d.artist_name)
        return {
          artist_name: d.artist_name,
          latitude: d.latitude!,
          longitude: d.longitude!,
          origin_city: d.origin_city,
          origin_country: d.origin_country,
          origin_location: d.origin_location,
          total_plays: plays?.total_plays ?? 0,
          total_hours: plays?.total_hours ?? 0,
        }
      })
      .filter((d) => d.total_plays > 0)
  }, [origins, artistPlayMap])

  const maxPlays = useMemo(
    () => (validData.length > 0 ? Math.max(...validData.map((d) => d.total_plays)) : 1),
    [validData]
  )

  const sizeScale = useMemo(
    () =>
      scaleSqrt()
        .domain([0, maxPlays])
        .range([4, 18]) as (value: number) => number,
    [maxPlays]
  )

  const activeArtist = activeFilters?.artist

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.5, 8))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.5, 1))
  }, [])

  const handleReset = useCallback(() => {
    setCenter(DEFAULT_CENTER)
    setZoom(DEFAULT_ZOOM)
  }, [])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Geographic Artist Origins</h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            {validData.length} artists mapped
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="rounded-md border border-zinc-700 bg-zinc-800 p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="rounded-md border border-zinc-700 bg-zinc-800 p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="rounded-md border border-zinc-700 bg-zinc-800 p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
              title="Reset view"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {validData.length === 0 ? (
        <div className="flex h-80 items-center justify-center text-sm text-zinc-500">
          No geographic data available. Run the ingest script to populate artist origins.
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-lg"
          onMouseLeave={() => setTooltip(null)}
        >
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{
              scale: 160 * zoom,
              center: center,
            }}
            className="h-auto w-full"
            viewBox="0 0 800 450"
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1a1a2e"
                    stroke="#2d2d44"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Geographies>

            {validData.map((artist) => {
              const r = sizeScale(artist.total_plays)
              const innerR = r * 0.5
              const coords: [number, number] = [artist.longitude, artist.latitude]
              const isActive = activeArtist === artist.artist_name
              const isDimmed = activeArtist && !isActive
              return (
                <Marker
                  key={artist.artist_name}
                  coordinates={coords}
                  onMouseEnter={(e) => {
                    setTooltip({ x: e.clientX, y: e.clientY, artist })
                  }}
                  onMouseMove={(e) => {
                    setTooltip((prev) =>
                      prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                    )
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => onFilterChange?.({ artist: artist.artist_name })}
                  style={{ cursor: 'pointer' }}
                >
                    <circle
                      r={r}
                      fill={isActive ? '#1ed760' : '#1DB954'}
                      fillOpacity={isDimmed ? 0.08 : isActive ? 0.4 : 0.25}
                      style={{ transformOrigin: 'center' }}
                    />
                    <circle
                      r={innerR}
                      fill={isActive ? '#1ed760' : '#1DB954'}
                      stroke={isActive ? '#1ed760' : '#1DB954'}
                      strokeWidth={isActive ? 2 : 1}
                      strokeOpacity={isDimmed ? 0.2 : 0.6}
                      style={{
                        filter: isActive
                          ? 'drop-shadow(0 0 8px rgba(30,215,96,0.7))'
                          : 'drop-shadow(0 0 4px rgba(29,185,84,0.5))',
                      }}
                    />
                </Marker>
              )
            })}
          </ComposableMap>

          {tooltip && (
            <div
              className="pointer-events-none fixed z-50 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 shadow-2xl"
              style={{
                left: tooltip.x + 12,
                top: tooltip.y - 10,
                transform: 'translateY(-100%)',
              }}
            >
              <div className="text-sm font-bold text-white">
                {tooltip.artist.artist_name}
              </div>
              <div className="mt-0.5 text-xs text-zinc-400">
                {tooltip.artist.origin_location || [tooltip.artist.origin_city, tooltip.artist.origin_country].filter(Boolean).join(', ')}
              </div>
              <div className="mt-1.5 flex gap-3 text-[10px]">
                <span className="text-emerald-400">
                  {tooltip.artist.total_plays.toLocaleString()} plays
                </span>
                <span className="text-teal-400">
                  {tooltip.artist.total_hours.toFixed(1)}h listened
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
