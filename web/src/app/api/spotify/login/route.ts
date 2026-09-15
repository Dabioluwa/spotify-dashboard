import { NextResponse } from 'next/server'

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: 'http://127.0.0.1:3000/spotify-callback',
    scope: 'user-read-recently-played user-top-read user-read-currently-playing',
  })

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

  return NextResponse.redirect(spotifyAuthUrl)
}
