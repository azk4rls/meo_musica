import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const track = req.nextUrl.searchParams.get("track")?.trim() ?? "";

  if (!artist || !track) {
    return NextResponse.json(
      { success: false, lyrics: [], error: "Missing artist or track" },
      { status: 400 },
    );
  }

  try {
    const endpoint = `https://lrclib.net/api/search?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`;
    const res = await fetch(endpoint, { next: { revalidate: 60 * 60 } });
    if (!res.ok) {
      return NextResponse.json({ success: true, lyrics: [] });
    }
    const data = (await res.json()) as Array<{
      syncedLyrics?: string;
      plainLyrics?: string;
      artistName?: string;
      trackName?: string;
    }>;
    const best = data?.[0];
    return NextResponse.json({
      success: true,
      lyrics: best?.syncedLyrics ?? "",
      plainLyrics: best?.plainLyrics ?? "",
      meta: {
        artist: best?.artistName ?? artist,
        track: best?.trackName ?? track,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        lyrics: [],
        error: error instanceof Error ? error.message : "Lyrics fetch failed",
      },
      { status: 500 },
    );
  }
}
