'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { scaleLinear } from 'd3-scale'
import type { HourlyHabit, DashboardFilters } from '@/lib/types'

interface HourlyProfileChartProps {
  data: HourlyHabit[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
}

function to12Hour(h: number): string {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-zinc-400">{to12Hour(Number(label))}</p>
      <p className="text-sm font-bold text-emerald-400">
        {payload[0].value?.toFixed(1)} hours
      </p>
    </div>
  )
}

export default function HourlyProfileChart({ data, activeFilters, onFilterChange }: HourlyProfileChartProps) {
  const chartData = data ?? []
  const maxVal = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.total_hours_played ?? 0))
    : 1
  const activeHour = activeFilters?.hour

  const colorScale = scaleLinear<string>()
    .domain([0, maxVal * 0.5, maxVal])
    .range(['#1a3a2a', '#1DB954', '#1ed760'])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Listening Heatmap</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">12-Hour Profile</span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            onClick={(e) => {
              if (e?.activeLabel != null && onFilterChange) {
                onFilterChange({ hour: Number(e.activeLabel) })
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="hour_of_day"
              tickFormatter={to12Hour}
              tick={{ fontSize: 9, fill: activeHour != null ? '#52525b' : '#71717a' }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(29, 185, 84, 0.05)' }} />
            <Bar
              dataKey="total_hours_played"
              radius={[2, 2, 0, 0]}
              maxBarSize={20}
              cursor="pointer"
            >
              {chartData.map((entry) => {
                const isActive = activeHour === entry.hour_of_day
                const isDimmed = activeHour != null && !isActive
                return (
                  <Cell
                    key={entry.hour_of_day}
                    fill={isActive ? '#1ed760' : colorScale(entry.total_hours_played ?? 0)}
                    fillOpacity={isDimmed ? 0.25 : isActive ? 1 : 0.9}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
