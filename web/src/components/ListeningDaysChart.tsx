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
import type { DayOfWeekStat, DashboardFilters } from '@/lib/types'

interface ListeningDaysChartProps {
  data: DayOfWeekStat[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
}

const DAY_COLORS: Record<string, string> = {
  Mon: '#1DB954',
  Tue: '#1aa34a',
  Wed: '#178f42',
  Thu: '#157b3a',
  Fri: '#1ed760',
  Sat: '#1DB954',
  Sun: '#178f42',
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="text-sm font-bold text-emerald-400">
        {payload[0].value?.toFixed(1)} hours
      </p>
    </div>
  )
}

export default function ListeningDaysChart({ data, activeFilters, onFilterChange }: ListeningDaysChartProps) {
  const chartData = data ?? []
  const activeDay = activeFilters?.dayOfWeek

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Favorite Listening Days</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Day of Week</span>
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
              if (e?.activeLabel && onFilterChange) {
                onFilterChange({ dayOfWeek: String(e.activeLabel) })
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="day_of_week"
              tick={{ fontSize: 11, fill: activeDay ? '#52525b' : '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(29, 185, 84, 0.05)' }} />
            <Bar
              dataKey="total_hours"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              cursor="pointer"
            >
              {chartData.map((entry) => {
                const isActive = activeDay === entry.day_of_week
                const isDimmed = activeDay && !isActive
                return (
                  <Cell
                    key={entry.day_of_week}
                    fill={isActive ? '#1ed760' : DAY_COLORS[entry.day_of_week] ?? '#1DB954'}
                    fillOpacity={isDimmed ? 0.25 : isActive ? 1 : 0.85}
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
