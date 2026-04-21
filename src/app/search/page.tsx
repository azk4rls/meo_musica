"use client";

import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Play, Search, X, Mic } from "lucide-react";

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
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
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
    return hasArtist &&
      !lowerTitle.includes("live stream") &&
      !lowerTitle.includes("podcast") &&
      !lowerTitle.includes("interview");
  };
  const results = rawResults.filter(isLikelySong);
  const finalResults = results.length > 0 ? results : rawResults;

  const artistCard = finalResults[0];
  const topTracks = finalResults.slice(0, 4);
  const similarTracks = finalResults.slice(1);

  return (
    <div className="min-h-full bg-[#0a0a0f] pb-28 font-sans">
      {/* ── STICKY SEARCH HEADER ── */}
      <div
        className={cn(
          "sticky top-0 z-20 px-4 py-4 transition-all duration-300 sm:px-6",
          focused ? "bg-[#0a0a0f]/95 backdrop-blur-xl" : "bg-[#0a0a0f]"
        )}
      >
        {/* Search input */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
            focused
              ? "border-white/20 bg-white/8 shadow-xl shadow-black/40"
              : "border-white/8 bg-white/5"
          )}
          onClick={() => inputRef.current?.focus()}
        >
          <Search
            size={17}
            className={cn("shrink-0 transition", focused ? "text-white/60" : "text-white/25")}
          />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Cari artis, lagu, playlist…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/25"
          />
          {text ? (
            <button
              type="button"
              onClick={() => { setText(""); inputRef.current?.focus(); }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50 transition hover:bg-white/20 hover:text-white"
            >
              <X size={12} />
            </button>
          ) : (
            <button type="button" className="shrink-0 text-white/20 transition hover:text-white/50">
              <Mic size={17} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {chips.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setChip(item)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-150",
                chip === item
                  ? "bg-white text-black shadow-md"
                  : "bg-white/8 text-white/55 hover:bg-white/14 hover:text-white"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 pt-3 sm:px-6">
        <AnimatePresence mode="wait">
          {searchQuery.isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* top result skeleton */}
              <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
                <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
                <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
              </div>
              {/* grid skeleton */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            </motion.div>
          ) : finalResults.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-20 text-center"
            >
              <div className="mb-3 text-4xl">🎵</div>
              <p className="text-sm font-semibold text-white/40">Tidak ada hasil</p>
              <p className="mt-1 text-xs text-white/20">Coba kata kunci lain</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* ── TOP RESULT + TOP TRACKS ── */}
              {artistCard && (
                <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                  {/* Top result card */}
                  <button
                    type="button"
                    onClick={() => playTrack(artistCard, finalResults)}
                    className="group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-3xl border border-white/8 bg-[#111118] p-5 text-left transition-all hover:border-white/15 sm:min-h-[240px]"
                  >
                    {/* bg cover */}
                    <div className="absolute inset-0">
                      <Image
                        src={artistCard.thumbnail}
                        alt={artistCard.artist}
                        fill
                        className="object-cover opacity-40 transition-all duration-500 group-hover:opacity-55 group-hover:scale-105"
                        sizes="640px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    </div>

                    {/* content */}
                    <div className="relative z-10">
                      <span className="mb-3 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur">
                        Top Result
                      </span>
                      <div className="text-2xl font-black leading-tight sm:text-3xl">{artistCard.artist}</div>
                      <div className="mt-1 truncate text-sm text-white/50">{artistCard.title}</div>
                    </div>

                    {/* play btn */}
                    <div className="absolute bottom-5 right-5 flex h-12 w-12 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      <Play size={16} fill="black" className="ml-0.5" />
                    </div>
                  </button>

                  {/* Top tracks panel */}
                  <div className="flex flex-col rounded-3xl border border-white/8 bg-[#111118] p-4">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/35">
                      Top Tracks
                    </p>
                    <div className="flex flex-1 flex-col gap-1">
                      {topTracks.map((track, idx) => (
                        <button
                          key={track.id + idx}
                          type="button"
                          onClick={() => playTrack(track, finalResults)}
                          className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-white/6"
                        >
                          <span className="w-4 shrink-0 text-center text-xs tabular-nums text-white/20">
                            {idx + 1}
                          </span>
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                            <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="44px" />
                            <div className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                              <Play size={14} className="text-white" fill="white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white/90 group-hover:text-white">
                              {track.title}
                            </div>
                            <div className="truncate text-xs text-white/35">{track.artist}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SIMILAR RESULTS ── */}
              <section>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/30">
                  Hasil Serupa
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {similarTracks.map((track, idx) => (
                    <motion.button
                      key={track.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.025, duration: 0.2 }}
                      type="button"
                      onClick={() => playTrack(track, similarTracks)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/3 px-3 py-2.5 text-left transition-all hover:bg-white/8 hover:border-white/12"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="44px" />
                        <div className="absolute inset-0 hidden items-center justify-center rounded-xl bg-black/50 group-hover:flex">
                          <Play size={13} className="text-white" fill="white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-white/85 group-hover:text-white">
                          {track.title}
                        </div>
                        <div className="truncate text-xs text-white/35">{track.artist}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}