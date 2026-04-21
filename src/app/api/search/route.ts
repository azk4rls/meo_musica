import { NextRequest, NextResponse } from "next/server";

type SearchResult = {
  id: string;
  title: string;
  thumbnail: string;
  artist: string;
  channelId?: string;
};

function pickBestThumbnail(item: any): string {
  const thumbs: any =
    item?.thumbnail?.thumbnails ??
    item?.thumbnails ??
    item?.thumbnail ??
    item?.snippet?.thumbnails ??
    [];

  if (Array.isArray(thumbs)) {
    const sorted = thumbs
      .map((t) => ({
        url: t?.url ?? t?.thumbnails?.[0]?.url,
        w: Number(t?.width ?? 0),
        h: Number(t?.height ?? 0),
      }))
      .filter((t) => typeof t.url === "string" && t.url.length > 0)
      .sort((a, b) => (b.w * b.h || 0) - (a.w * a.h || 0));
    return sorted[0]?.url ?? "";
  }

  if (typeof thumbs === "string") return thumbs;
  return typeof thumbs?.url === "string" ? thumbs.url : "";
}

function extractVideoId(item: any): string {
  const id = item?.id ?? item?.videoId ?? item?.video?.id;
  if (typeof id === "string") return id;
  return id?.videoId ?? id?.id ?? "";
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      {
        success: false,
        query: q,
        count: 0,
        results: [] as SearchResult[],
        error: "Missing query parameter: q",
      },
      { status: 400 },
    );
  }

  try {
    const mod: any = await import("youtube-search-api");
    const yts: any = mod?.default ?? mod;
    // Append "song" to query to prioritize music if it doesn't contain music keywords
    const searchQuery = q.toLowerCase().match(/(song|music|audio|lyric|official)/) ? q : `${q} song`;
    const data: any = await yts.GetListByKeyword(searchQuery, false, 20);

    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    const results: SearchResult[] = items
      .filter((item) => item?.type === "video" || !item?.type)
      .map((item) => {
        const id = extractVideoId(item);
        const title = String(item?.title ?? item?.name ?? "").trim();
        const artist = String(
          item?.channelTitle ??
            item?.channel?.name ??
            item?.author ??
            item?.creator ??
            "",
        ).trim();
        const thumbnail = pickBestThumbnail(item);
        const channelId = String(item?.channelId ?? item?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ?? "").trim();

        return { id, title, artist, thumbnail, channelId };
      })
      .filter((r) => r.id && r.title);

    return NextResponse.json({
      success: true,
      query: q,
      count: results.length,
      results,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to search YouTube";
    return NextResponse.json(
      {
        success: false,
        query: q,
        count: 0,
        results: [] as SearchResult[],
        error: message,
      },
      { status: 500 },
    );
  }
}
