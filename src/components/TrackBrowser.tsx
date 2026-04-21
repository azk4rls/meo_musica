"use client";

import React from "react";
import Image from "next/image";
import { Play, Search } from "lucide-react";

import { LikeButton } from "@/components/LikeButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { cn } from "@/lib/cn";
import { type Track, usePlayerStore } from "@/store/usePlayerStore";

type SearchResponse = { results: Track[]; error?: string };

type TrackBrowserProps = {
  defaultQuery: string;
  title: string;
  subtitle: string;
  categories?: string[];
};

export function TrackBrowser({
  defaultQuery,
  title,
  subtitle,
  categories = [],
}: TrackBrowserProps) {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const { user, signInWithGoogle, signOut, isSupabaseConfigured } = useSupabaseAuth();
  const { favoriteIds, toggleFavorite } = useFavorites(user?.id);

  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Track[]>([]);
  const [status, setStatus] = React.useState<
    "idle" | "searching" | "ready" | "error"
  >("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");

  const abortRef = React.useRef<AbortController | null>(null);
  const debounceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const fetchTracks = async (query: string, signal: AbortSignal) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
      const data = (await res.json()) as SearchResponse;
      if (!res.ok) throw new Error(data.error || "Search failed");
      return Array.isArray(data.results) ? data.results : [];
    };

    const rawQuery = q.trim();
    const effectiveQuery = rawQuery || selectedCategory || defaultQuery;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setStatus("searching");
    setError(null);

    debounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let nextResults = await fetchTracks(effectiveQuery, controller.signal);
        if (!rawQuery && nextResults.length === 0 && effectiveQuery !== defaultQuery) {
          nextResults = await fetchTracks(defaultQuery, controller.signal);
          setSelectedCategory("");
        }
        setResults(nextResults);
        setStatus("ready");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "Search failed";
        setResults([]);
        setStatus("error");
        setError(msg);
      }
    }, 280);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [defaultQuery, q, selectedCategory]);

  const isHome = title.toLowerCase() === "home";
  const featured = results.slice(0, 5);
  const quickPicks = results.slice(5, 17);
  const longListens = results.slice(17, 35);
  const topArtists = Array.from(
    new Map(
      results
        .filter((t) => t.artist?.trim())
        .map((t) => [t.artist, t]),
    ).values(),
  ).slice(0, 12);

  return (
    <div className="min-h-full bg-[#121212] p-4 sm:p-6">
      <div className="mb-8 rounded-xl bg-gradient-to-b from-white/10 to-transparent p-5 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-5xl">{title}</h1>
            <p className="mt-2 text-sm text-[#b3b3b3]">{subtitle}</p>
          </div>
          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold hover:border-white/40"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={!isSupabaseConfigured}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
            >
              {isSupabaseConfigured ? "Sign in to sync likes" : "Setup Supabase to enable likes"}
            </button>
          )}
        </div>

        <div className="mt-6 max-w-2xl">
          <label className="relative block">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b3b3b3]"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What do you want to listen to?"
              className={cn(
                "w-full rounded-full border border-white/10 bg-black/40 px-12 py-3.5 text-sm text-white",
                "outline-none placeholder:text-[#b3b3b3]",
                "focus:border-[#1DB954] focus:ring-4 focus:ring-[#1DB954]/20",
              )}
            />
          </label>
          <div className="mt-2 text-xs text-[#b3b3b3]">
            {status === "searching" ? "Searching..." : null}
            {status === "ready" ? `${results.length} result(s)` : null}
            {status === "ready" && !q.trim() ? `Now showing: ${defaultQuery}` : null}
            {status === "error" && error ? `Error: ${error}` : null}
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = q.trim().toLowerCase() === category.toLowerCase();
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setQ("");
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    active || selectedCategory.toLowerCase() === category.toLowerCase()
                      ? "bg-[#1DB954] text-black"
                      : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isHome ? (
        <>
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Music channels you may like</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {featured.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => playTrack(track, results)}
                  className="group text-left"
                >
                  <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-full">
                    <Image
                      src={track.thumbnail}
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold">{track.title}</div>
                  <div className="truncate text-xs text-[#b3b3b3]">{track.artist}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Quick picks</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {quickPicks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => playTrack(track, results)}
                  className="group flex items-center gap-3 rounded-lg bg-[#181818] p-2 text-left transition hover:bg-[#282828]"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                    <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{track.title}</div>
                    <div className="truncate text-xs text-[#b3b3b3]">{track.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Artists you might like</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {topArtists.map((track) => (
                <button
                  key={`${track.artist}-${track.id}`}
                  type="button"
                  onClick={() => {
                    setQ(track.artist);
                    setSelectedCategory("");
                  }}
                  className="rounded-lg bg-[#181818] p-3 text-left transition hover:bg-[#282828]"
                >
                  <div className="truncate text-sm font-semibold">{track.artist}</div>
                  <div className="mt-1 truncate text-xs text-[#b3b3b3]">
                    Explore songs
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-4">
            <h2 className="mb-4 text-2xl font-bold">Long listens</h2>
            <div className="space-y-1">
              {longListens.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => playTrack(track, results)}
                  className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-white/10"
                >
                  <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded">
                    <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{track.title}</div>
                    <div className="truncate text-xs text-[#b3b3b3]">{track.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {!isHome || q.trim() ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((track) => (
            <div
              key={track.id}
              onClick={() => playTrack(track, results)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  playTrack(track, results);
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                "group rounded-xl bg-[#181818] p-3 text-left transition",
                "hover:bg-[#282828]",
                "focus:outline-none focus:ring-4 focus:ring-[#1DB954]/20",
              )}
            >
              <div className="relative aspect-square overflow-hidden rounded-lg">
                {track.thumbnail ? (
                  <Image
                    src={track.thumbnail}
                    alt={track.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 45vw, 220px"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-3 right-3 flex h-12 w-12 translate-y-2 items-center justify-center rounded-full bg-[#1DB954] text-black opacity-0 shadow-2xl transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <Play size={20} className="ml-0.5" />
                </div>
                <div className="absolute left-2 top-2 z-10">
                  <LikeButton
                    liked={favoriteIds.has(track.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleFavorite(track);
                    }}
                    disabled={!user}
                  />
                </div>
              </div>
              <div className="mt-3">
                <div className="truncate text-sm font-bold text-white">{track.title}</div>
                <div className="mt-1 truncate text-xs text-[#b3b3b3]">{track.artist}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {status === "ready" && results.length === 0 ? (
        <div className="mt-8 rounded-xl bg-[#181818] p-5 text-sm text-[#b3b3b3]">
          No results found. Try another keyword.
        </div>
      ) : null}
    </div>
  );
}
