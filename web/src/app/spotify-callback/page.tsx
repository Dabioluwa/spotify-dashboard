import { Suspense } from 'react'
import CallbackContent from './CallbackContent'

interface Props {
  searchParams: Promise<{ code?: string; error?: string }>
}

async function ExchangeCode({ code }: { code: string }) {
  const redirectUri = 'http://127.0.0.1:3000/spotify-callback'

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  })

  const data = await response.json()

  if (data.error) {
    return (
      <CallbackContent
        status="error"
        error={data.error_description || data.error}
      />
    )
  }

  return (
    <CallbackContent
      status="success"
      refreshToken={data.refresh_token}
      accessToken={data.access_token}
      expiresIn={data.expires_in}
    />
  )
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-white">Spotify Authorization</h1>
        <p className="text-sm text-zinc-400">Exchanging authorization code...</p>
      </div>
    </div>
  )
}

export default async function SpotifyCallbackPage({ searchParams }: Props) {
  const { code, error } = await searchParams

  if (error) {
    return (
      <CallbackContent
        status="error"
        error={`Authorization denied: ${error}`}
      />
    )
  }

  if (!code) {
    return (
      <CallbackContent
        status="error"
        error="No authorization code received from Spotify."
      />
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ExchangeCode code={code} />
    </Suspense>
  )
}
