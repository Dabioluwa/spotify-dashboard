'use client'

import { useState } from 'react'

interface Props {
  status: 'success' | 'error'
  refreshToken?: string
  accessToken?: string
  expiresIn?: number
  error?: string
}

export default function CallbackContent({ status, refreshToken, error }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (refreshToken) {
      navigator.clipboard.writeText(refreshToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddToEnv = () => {
    if (!refreshToken) return
    const envLine = `SPOTIFY_REFRESH_TOKEN=${refreshToken}`
    navigator.clipboard.writeText(envLine)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        {status === 'success' ? (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-white">Connected to Spotify!</h1>
            <p className="mb-4 text-sm text-zinc-400">Add this refresh token to your <code className="text-emerald-400">.env.local</code>:</p>

            <div className="mb-4 text-left">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                <code className="break-all text-xs text-emerald-400">{refreshToken}</code>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleAddToEnv}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
              >
                {copied ? 'Copied!' : 'Copy .env Line'}
              </button>
              <button
                onClick={() => { window.location.href = '/' }}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left">
              <p className="mb-2 text-xs font-medium text-zinc-500">Next steps:</p>
              <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-400">
                <li>Click &quot;Copy .env Line&quot; above</li>
                <li>Paste it into <code className="text-zinc-300">web/.env.local</code></li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-white">Authorization Failed</h1>
            <p className="mb-4 text-sm text-red-400">{error}</p>
            <a
              href="/api/spotify/login"
              className="inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
            >
              Try Again
            </a>
          </>
        )}
      </div>
    </div>
  )
}
