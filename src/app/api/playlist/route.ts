import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const supabase = getSupabaseServer();
  if (!supabase || !userId) return NextResponse.json({ success: true, playlists: [] });

  const { data, error } = await supabase
    .from("playlists")
    .select("id,name,created_at,playlist_tracks(track_id,title,artist,thumbnail,sort_order)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, playlists: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
  }

  const body = (await req.json()) as {
    userId?: string;
    name?: string;
    tracks?: Array<{ id: string; title: string; artist: string; thumbnail: string }>;
  };
  if (!body.userId || !body.name) {
    return NextResponse.json({ success: false, error: "Missing userId or name" }, { status: 400 });
  }

  const { data: playlist, error } = await supabase
    .from("playlists")
    .insert({ user_id: body.userId, name: body.name })
    .select("id")
    .single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (body.tracks?.length) {
    const payload = body.tracks.map((track, index) => ({
      playlist_id: playlist.id,
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      sort_order: index,
    }));
    await supabase.from("playlist_tracks").insert(payload);
  }

  return NextResponse.json({ success: true, playlistId: playlist.id });
}
