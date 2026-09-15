'use client'

export function Spinner({ size = 40 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
      style={{ width: size, height: size }}
    />
  )
}

export function MusicBars() {
  return (
    <div className="flex items-end gap-1 h-10">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1.5 bg-emerald-500 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
            height: `${12 + (i % 3) * 6}px`,
          }}
        />
      ))}
    </div>
  )
}

export function PulsingDot() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}
