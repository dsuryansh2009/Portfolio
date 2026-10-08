import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const username = process.env.LASTFM_USERNAME;
  const apiKey = process.env.LASTFM_API_KEY;

  if (!username || !apiKey) {
    return NextResponse.json({
      username: "lastfm",
      recenttracks: {
        track: [
          {
            name: "FLIP THE SWITCH (feat. Drake)",
            artist: { "#text": "Quavo" },
            album: { "#text": "Quavo Huncho" },
            image: [
              { "#text": "" },
              { "#text": "" },
              { "#text": "" },
              { "#text": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png" }
            ],
            date: { uts: String(Math.floor(Date.now() / 1000) - 8 * 3600) }
          }
        ]
      }
    });
  }

  try {
    const res = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`,
      { next: { revalidate: 30 } } // Cache for 30 seconds
    );
    
    if (!res.ok) {
      throw new Error("Failed to fetch from Last.fm");
    }

    const data = await res.json();
    return NextResponse.json({ ...data, username });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
