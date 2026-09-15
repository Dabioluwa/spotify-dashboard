'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DashboardFilters } from '@/lib/types'

interface TrendDatum {
  year_month: string
  total_hours_played: number
  total_streams: number
  label: string
}

interface ListeningTrendProps {
  data: TrendDatum[] | null
  activeFilters?: DashboardFilters
  onFilterChange?: (filter: Partial<DashboardFilters>) => void
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

export default function ListeningTrend({ data }: ListeningTrendProps) {
  const chartData = data ?? []

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Listening Trend</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Hours vs Month</span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total_hours_played"
              stroke="#1DB954"
              strokeWidth={2}
              fill="url(#gradientArea)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#1DB954',
                stroke: '#0a0a0a',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
