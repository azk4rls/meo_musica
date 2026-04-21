import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const supabase = getSupabaseServer();
  if (!supabase || !userId) return NextResponse.json({ success: true, likes: [] });

  const { data, error } = await supabase
    .from("liked_songs")
    .select("track_id,title,artist,thumbnail,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, likes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
  }
  const body = (await req.json()) as {
    userId?: string;
    track?: { id: string; title: string; artist: string; thumbnail: string };
  };
  if (!body.userId || !body.track?.id) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  const { data: exists } = await supabase
    .from("liked_songs")
    .select("id")
    .eq("user_id", body.userId)
    .eq("track_id", body.track.id)
    .maybeSingle();

  if (exists?.id) {
    await supabase.from("liked_songs").delete().eq("id", exists.id);
    return NextResponse.json({ success: true, liked: false });
  }

  const { error } = await supabase.from("liked_songs").insert({
    user_id: body.userId,
    track_id: body.track.id,
    title: body.track.title,
    artist: body.track.artist,
    thumbnail: body.track.thumbnail,
  });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, liked: true });
}
