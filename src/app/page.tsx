"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Play, TrendingUp, Music2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { type Track, usePlayerStore } from "@/store/usePlayerStore";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type ApiTrack = { id: string; title: string; artist: string; thumbnail: string };

const CATEGORIES = [
  "Chill", "Focus", "Commute", "Gaming", "Energize",
  "Party", "Feel good", "Romance", "Workout", "Sleep",
  "Sad", "Happy", "Nostalgia", "Acoustic", "Pop", "Rock",
] as const;
type Category = (typeof CATEGORIES)[number];

const REGIONS = ["Indonesia", "Global", "Trending"] as const;
type Region = (typeof REGIONS)[number];

const hasThumb = (url?: string) => Boolean(url && /^https?:\/\//.test(url));

/* ─────────────────────────────────────────────────────────────────────────────
   Greeting — rendered client-side only to avoid SSR hydration mismatch.
   The `fdprocessedid` error in SearchPage has the same root cause: a browser
   extension injecting attributes onto <input> elements. Fix that by adding
   `suppressHydrationWarning` to the <input> in SearchPage, or wrapping the
   search bar in a dynamic import with `{ ssr: false }`.
───────────────────────────────────────────────────────────────────────────── */
function Greeting() {
  const [text, setText] = React.useState<string | null>(null);

  React.useEffect(() => {
    const h = new Date().getHours();
    if (h < 5)       setText("Selamat malam");
    else if (h < 11) setText("Selamat pagi");
    else if (h < 15) setText("Selamat siang");
    else if (h < 18) setText("Selamat sore");
    else             setText("Selamat malam");
  }, []);

  if (!text) return null;
  return <span className="text-[13px] font-normal text-white/35">{text}</span>;
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-2.5">
      <div className="aspect-square w-full rounded-xl bg-white/[0.07]" />
      <div className="h-2.5 w-4/5 rounded-full bg-white/[0.06]" />
      <div className="h-2 w-3/5 rounded-full bg-white/[0.04]" />
    </div>
  );
}

/* ─── Track Card (grid) ─────────────────────────────────────────────────────── */
function TrackCard({
  track,
  queue,
  onPlay,
}: {
  track: ApiTrack;
  queue: ApiTrack[];
  onPlay: (t: ApiTrack, q: ApiTrack[]) => void;
}) {
  return (
    <button type="button" onClick={() => onPlay(track, queue)} className="group w-full text-left">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#181820]">
        {hasThumb(track.thumbnail) ? (
          <Image
            src={track.thumbnail}
            alt={track.title}
            fill
            sizes="200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2 size={22} className="text-white/15" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1ed760] shadow-[0_4px_16px_rgba(30,215,96,0.4)]">
            <Play size={15} className="ml-0.5 text-black" fill="black" />
          </div>
        </div>
      </div>
      <div className="mt-2.5 space-y-0.5 px-0.5">
        <p className="truncate text-[12.5px] font-semibold leading-snug text-white/90">{track.title}</p>
        <p className="truncate text-[11px] text-white/38">{track.artist}</p>
      </div>
    </button>
  );
}

/* ─── Track Row (list) ──────────────────────────────────────────────────────── */
function TrackRow({
  track,
  index,
  queue,
  onPlay,
}: {
  track: ApiTrack;
  index: number;
  queue: ApiTrack[];
  onPlay: (t: ApiTrack, q: ApiTrack[]) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(track, queue)}
      className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.05]"
    >
      <span className="w-5 shrink-0 text-right text-[11px] text-white/22 group-hover:hidden">
        {index + 1}
      </span>
      <Play size={11} className="hidden shrink-0 text-white group-hover:block" fill="white" />

      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#181820]">
        {hasThumb(track.thumbnail) && (
          <Image src={track.thumbnail} alt={track.title} fill sizes="40px" className="object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white/88">{track.title}</p>
        <p className="truncate text-[11px] text-white/38">{track.artist}</p>
      </div>
    </button>
  );
}

/* ─── Artist Circle ─────────────────────────────────────────────────────────── */
function ArtistCard({
  track,
  allTracks,
  onPlay,
}: {
  track: ApiTrack;
  allTracks: ApiTrack[];
  onPlay: (t: ApiTrack, q: ApiTrack[]) => void;
}) {
  return (
    <button type="button" onClick={() => onPlay(track, allTracks)} className="group text-center">
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-[#181820]">
        {hasThumb(track.thumbnail) && (
          <Image
            src={track.thumbnail}
            alt={track.artist}
            fill
            sizes="100px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
          />
        )}
      </div>
      <p className="mt-2.5 truncate text-[12px] font-semibold text-white/80">{track.artist}</p>
      <p className="text-[10.5px] text-white/28">Artis</p>
    </button>
  );
}

/* ─── Home Page ─────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const { user } = useSupabaseAuth();

  const [category, setCategory] = React.useState<Category>("Chill");
  const [region, setRegion]     = React.useState<Region>("Indonesia");

  const play = (t: ApiTrack, q: ApiTrack[]) => playTrack(t as Track, q as Track[]);

  /* Queries */
  const recQuery = useQuery({
    queryKey: ["home-rec", user?.id, category, region],
    queryFn: async () => {
      const res  = await fetch(`/api/recommendations?userId=${encodeURIComponent(user?.id ?? "")}&mood=${encodeURIComponent(`${region} ${category}`)}`);
      const body = (await res.json()) as { results?: ApiTrack[] };
      return (body.results ?? []).filter((t) => hasThumb(t.thumbnail));
    },
  });

  const recentQuery = useQuery({
    queryKey: ["home-recent", user?.id],
    enabled:  Boolean(user?.id),
    queryFn: async () => {
      const res  = await fetch(`/api/recently-played?userId=${encodeURIComponent(user?.id ?? "")}`);
      const body = (await res.json()) as { items?: Array<{ track_id: string; title: string; artist: string; thumbnail: string }> };
      return (body.items ?? [])
        .map((i) => ({ id: i.track_id, title: i.title, artist: i.artist, thumbnail: i.thumbnail }))
        .filter((t) => hasThumb(t.thumbnail)) as ApiTrack[];
    },
  });

  const recommended = recQuery.data ?? [];
  const recent      = recentQuery.data ?? [];

  const listenAgain = recent.length ? recent.slice(0, 8) : recommended.slice(0, 8);
  const forYou      = recommended.slice(0, 8);
  const trending    = recommended.slice(8, 16);
  const artists     = Array.from(new Map(recommended.map((t) => [t.artist, t])).values()).slice(0, 8);

  const loading = recQuery.isLoading;

  return (
    <div className="min-h-full bg-[#0a0a0f] px-5 pb-32 pt-6 md:px-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-[22px] font-extrabold tracking-tight text-white">Haloouuu!</h1>
        <Greeting />
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="mb-8 space-y-3">
        {/* Region */}
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-150",
                region === r
                  ? "bg-white text-black"
                  : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12] hover:text-white/75",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Mood */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3 py-1 text-[11.5px] font-medium transition-all duration-150",
                category === c
                  ? "bg-white/[0.14] text-white ring-1 ring-inset ring-white/25"
                  : "bg-white/[0.05] text-white/42 hover:bg-white/[0.09] hover:text-white/65",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Listen Again ───────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[14.5px] font-bold text-white/88 tracking-tight">
            {recent.length ? "Dengarkan lagi" : `Pilihan ${category} untukmu`}
          </h2>
          {!loading && listenAgain.length > 0 && (
            <span className="text-[11px] text-white/22">{listenAgain.length} lagu</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
            {listenAgain.map((t, i) => (
              <TrackRow key={`ra-${t.id}`} track={t} index={i} queue={listenAgain} onPlay={play} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {listenAgain.map((t) => (
              <TrackCard key={`la-${t.id}`} track={t} queue={listenAgain} onPlay={play} />
            ))}
          </div>
        )}
      </section>

      <div className="mb-10 h-px bg-white/[0.06]" />

      {/* ── For You ────────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[14.5px] font-bold text-white/88 tracking-tight">
            {category} · {region}
          </h2>
          {!loading && forYou.length > 0 && (
            <span className="text-[11px] text-white/22">{forYou.length} lagu</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
            : forYou.map((t) => (
                <TrackCard key={`fy-${t.id}`} track={t} queue={forYou} onPlay={play} />
              ))}
        </div>
      </section>

      {/* ── Trending ───────────────────────────────────────────────────────── */}
      {(loading || trending.length > 0) && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={13} className="text-white/30" />
            <h2 className="text-[14.5px] font-bold text-white/88 tracking-tight">
              Trending · {region}
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
              : trending.map((t) => (
                  <TrackCard key={`tr-${t.id}`} track={t} queue={trending} onPlay={play} />
                ))}
          </div>
        </section>
      )}

      {/* ── Artist Discovery ───────────────────────────────────────────────── */}
      {(loading || artists.length > 0) && (
        <>
          <div className="mb-10 h-px bg-white/[0.06]" />
          <section className="mb-10">
            <h2 className="mb-4 text-[14.5px] font-bold text-white/88 tracking-tight">
              Artis pilihan
            </h2>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
                : artists.map((t) => (
                    <ArtistCard
                      key={`ar-${t.artist}`}
                      track={t}
                      allTracks={artists}
                      onPlay={play}
                    />
                  ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}