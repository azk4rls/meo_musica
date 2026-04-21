import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const supabase = getSupabaseServer();
  if (!supabase || !userId) return NextResponse.json({ success: true, items: [] });

  const { data, error } = await supabase
    .from("recently_played")
    .select("track_id,title,artist,thumbnail,last_played_at")
    .eq("user_id", userId)
    .order("last_played_at", { ascending: false })
    .limit(40);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data ?? [] });
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

  const { data: existing } = await supabase
    .from("recently_played")
    .select("id")
    .eq("user_id", body.userId)
    .eq("track_id", body.track.id)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("recently_played")
      .update({
        title: body.track.title,
        artist: body.track.artist,
        thumbnail: body.track.thumbnail,
        last_played_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("recently_played").insert({
    user_id: body.userId,
    track_id: body.track.id,
    title: body.track.title,
    artist: body.track.artist,
    thumbnail: body.track.thumbnail,
    last_played_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
