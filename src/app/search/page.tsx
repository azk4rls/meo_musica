"use client";

import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Play, Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { type Track, usePlayerStore } from "@/store/usePlayerStore";

type SearchResponse = { results: Track[]; error?: string };
const validThumb = (url?: string) => Boolean(url && /^https?:\/\//.test(url));
const chips = ["All", "Popular", "Songs", "Videos", "Artists", "Profiles"] as const;

function useDebounced(value: string, ms = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function SearchPage() {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [text, setText] = React.useState("");
  const [chip, setChip] = React.useState<(typeof chips)[number]>("All");
  const debounced = useDebounced(text, 400);

  const queryText = React.useMemo(
    () => `${debounced || "trending"} ${chip === "All" ? "" : chip}`.trim(),
    [debounced, chip],
  );

  const searchQuery = useQuery({
    queryKey: ["search-page", queryText],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(queryText)}`);
      const body = (await res.json()) as SearchResponse;
      if (!res.ok) throw new Error(body.error || "Search failed");
      return (body.results ?? []).filter((t) => validThumb(t.thumbnail));
    },
  });

  const rawResults = searchQuery.data ?? [];
  const isLikelySong = (track: Track) => {
    const lowerTitle = track.title.toLowerCase();
    const hasArtist = track.artist && track.artist.trim();
    // Since API now appends 'song', we can be less restrictive.
    // Just avoid obvious non-songs and ensure it has an artist.
    return hasArtist && 
           !lowerTitle.includes('live stream') && 
           !lowerTitle.includes('podcast') &&
           !lowerTitle.includes('interview');
  };
  const results = rawResults.filter(isLikelySong);
  // If no results match the filter but we have raw results, fallback to raw results
  const finalResults = results.length > 0 ? results : rawResults;
  
  const artistCard = finalResults[0];
  const topTracks = finalResults.slice(0, 3);
  const similarTracks = finalResults.slice(1);

  return (
    <div className="min-h-full bg-[#07070b] px-4 pb-28 pt-6 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-2xl border border-white/10 bg-[#151722] p-2">
          <Search size={18} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cari artis, lagu, playlist"
            className="w-full rounded-xl bg-transparent py-3 pl-10 pr-10 text-sm text-white outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setChip(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                chip === item ? "bg-violet-500 text-white" : "bg-white/10 text-white/70",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {artistCard ? (
        <section className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <button
            type="button"
            onClick={() => playTrack(artistCard, finalResults)}
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/40 to-black p-6 text-left transition-all hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/20"
          >
            <div className="absolute right-0 top-0 h-full w-full opacity-30 md:w-1/2">
              <Image src={artistCard.thumbnail} alt={artistCard.artist} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>
            <div className="relative z-10">
              <div className="mb-2 w-max rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Top Result</div>
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-black md:h-32 md:w-32">
                <Image src={artistCard.thumbnail} alt={artistCard.artist} fill className="object-cover" sizes="128px" />
              </div>
              <div className="mt-4 text-3xl font-black md:text-5xl">{artistCard.artist}</div>
              <div className="mt-1 text-sm font-medium text-white/60">{artistCard.title}</div>
            </div>
          </button>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#151722] p-5">
            <div className="text-sm font-bold text-white/80">Top Tracks</div>
            <div className="flex-1 space-y-1">
              {topTracks.map((track, idx) => (
                <button
                  key={track.id + idx}
                  type="button"
                  onClick={() => playTrack(track, finalResults)}
                  className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/10"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg shadow-md">
                    <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="48px" />
                    <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                      <Play size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white group-hover:text-violet-400">{track.title}</div>
                    <div className="truncate text-xs font-medium text-white/50">{track.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8 pb-10">
        <h2 className="mb-4 text-xl font-black tracking-tight">Similar Results</h2>
        <AnimatePresence mode="wait">
          {searchQuery.isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {similarTracks.map((track, idx) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => playTrack(track, similarTracks)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-[#121521] px-3 py-2 text-left hover:border-violet-400/30"
                >
                  <div className="relative h-11 w-11 overflow-hidden rounded">
                    <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="44px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{track.title}</div>
                    <div className="truncate text-xs text-white/60">{track.artist}</div>
                  </div>
                  <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white group-hover:flex">
                    <Play size={14} className="ml-0.5" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
