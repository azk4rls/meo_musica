import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";

type Track = { id: string; title: string; artist: string; thumbnail: string };
const hasThumb = (url: string) => /^https?:\/\//.test(url);

function mapYoutubeItems(items: any[]): Track[] {
  return items
    .filter((item) => item?.type === "video" || !item?.type)
    .map((item) => ({
      id: String(item?.id ?? ""),
      title: String(item?.title ?? "").trim(),
      artist: String(item?.channelTitle ?? "").trim(),
      thumbnail: String(item?.thumbnail?.thumbnails?.[0]?.url ?? item?.thumbnail?.[0]?.url ?? ""),
    }))
    .filter((t) => t.id && t.title && hasThumb(t.thumbnail));
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim() ?? "";
  const mood = req.nextUrl.searchParams.get("mood")?.trim() ?? "all";

  try {
    let seeds: string[] = [];
    const supabase = getSupabaseServer();
    if (supabase && userId) {
      const [likedRes, recentRes] = await Promise.all([
        supabase.from("liked_songs").select("artist").eq("user_id", userId).limit(20),
        supabase.from("recently_played").select("artist").eq("user_id", userId).limit(20),
      ]);

      const likedArtists = (likedRes.data ?? []).map((x: { artist: string }) => x.artist);
      const recentArtists = (recentRes.data ?? []).map((x: { artist: string }) => x.artist);
      seeds = Array.from(new Set([...recentArtists, ...likedArtists])).filter(Boolean);
    }

    if (!seeds.length) {
      seeds = ["Top global hits", "Indie pop mix", "Chill electronic", "Acoustic sessions", "viral now"];
    }
    if (mood !== "all") {
      seeds.unshift(`${mood} music mix`);
    }
    seeds.push("new release friday");

    const youtubeMod: any = await import("youtube-search-api");
    const yts: any = youtubeMod?.default ?? youtubeMod;

    const resultChunks = await Promise.all(
      seeds.slice(0, 6).map(async (seed, idx) => {
        const data = await yts.GetListByKeyword(seed, false, idx < 2 ? 12 : 8);
        return mapYoutubeItems(Array.isArray(data?.items) ? data.items : []);
      }),
    );

    const merged = Array.from(new Map(resultChunks.flat().map((t) => [t.id, t])).values());
    return NextResponse.json({ success: true, seeds, results: merged });
  } catch (error) {
    return NextResponse.json(
      { success: false, results: [], error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
