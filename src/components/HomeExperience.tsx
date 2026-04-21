"use client";

import React from "react";
import Image from "next/image";
import { Play, Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { type Track, usePlayerStore } from "@/store/usePlayerStore";

type SearchResponse = { results: Track[]; error?: string };
type HomeSection = { title: string; query: string; layout: "circle" | "grid" | "list"; tracks: Track[] };

const moods = [
  "For you",
  "Chill",
  "Focus",
  "Workout",
  "Romance",
  "Party",
  "Sleep",
  "Nostalgia",
];

const sectionBlueprints: Omit<HomeSection, "tracks">[] = [
  { title: "Music channels you may like", query: "popular music artists live", layout: "circle" },
  { title: "Live performances", query: "live music session", layout: "grid" },
  { title: "Charts", query: "top chart songs global", layout: "grid" },
  { title: "Long listens", query: "best playlist mix full album", layout: "list" },
];

async function fetchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const data = (await res.json()) as SearchResponse;
  if (!res.ok) throw new Error(data.error || "Failed to fetch tracks");
  return data.results ?? [];
}

export function HomeExperience() {
  const playTrack = usePlayerStore((s) => s.playTrack);

  const [search, setSearch] = React.useState("");
  const [activeMood, setActiveMood] = React.useState(moods[0]);
  const [sections, setSections] = React.useState<HomeSection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const moodQuery = activeMood === "For you" ? "Top global hits" : `${activeMood} music mix`;
        const allBlueprints = [{ title: "Made for you", query: moodQuery, layout: "grid" as const }, ...sectionBlueprints];
        const payload = await Promise.all(
          allBlueprints.map(async (item) => ({
            ...item,
            tracks: await fetchTracks(item.query),
          })),
        );
        if (!cancelled) setSections(payload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeMood]);

  const searchResults = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const merged = sections.flatMap((section) => section.tracks);
    const deduped = Array.from(new Map(merged.map((t) => [t.id, t])).values());
    return deduped.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q),
    );
  }, [search, sections]);

  return (
    <div className="min-h-full bg-[#121212] px-4 pb-8 pt-5 sm:px-6">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-600/30 via-emerald-500/10 to-transparent p-5">
        <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Your Music Space</h1>
        <p className="mt-2 text-sm text-[#b3b3b3]">
          Rekomendasi dinamis berdasarkan mood, artis, dan chart real-time.
        </p>
        <div className="relative mt-5 max-w-2xl">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b3b3b3]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search songs, albums, artists"
            className={cn(
              "w-full rounded-full border border-white/10 bg-black/40 px-12 py-3 text-sm",
              "text-white outline-none placeholder:text-[#b3b3b3]",
              "focus:border-[#1DB954] focus:ring-4 focus:ring-[#1DB954]/20",
            )}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {moods.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => setActiveMood(mood)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                activeMood === mood ? "bg-[#1DB954] text-black" : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="mb-4 text-sm text-rose-300">{error}</div> : null}
      {loading ? <div className="mb-4 text-sm text-[#b3b3b3]">Loading your personalized feed...</div> : null}

      {search.trim() ? (
        <section>
          <h2 className="mb-3 text-2xl font-bold">Search results</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {searchResults.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onPlay={() => playTrack(track, searchResults)}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-2xl font-bold">{section.title}</h2>
              {section.layout === "circle" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {section.tracks.slice(0, 12).map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => playTrack(track, section.tracks)}
                      className="text-left"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-full">
                        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="180px" />
                      </div>
                      <div className="mt-2 truncate text-sm font-semibold">{track.title}</div>
                      <div className="truncate text-xs text-[#b3b3b3]">{track.artist}</div>
                    </button>
                  ))}
                </div>
              ) : null}

              {section.layout === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {section.tracks.slice(0, 15).map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      onPlay={() => playTrack(track, section.tracks)}
                    />
                  ))}
                </div>
              ) : null}

              {section.layout === "list" ? (
                <div className="space-y-1">
                  {section.tracks.slice(0, 12).map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => playTrack(track, section.tracks)}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-white/10"
                    >
                      <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded">
                        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{track.title}</div>
                        <div className="truncate text-xs text-[#b3b3b3]">{track.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackCard({ track, onPlay }: { track: Track; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group rounded-xl bg-[#181818] p-3 text-left transition hover:bg-[#282828]"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="220px" />
        <div className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" />
        <div className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-[#1DB954] text-black opacity-0 shadow-2xl transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <Play size={18} className="ml-0.5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="truncate text-sm font-bold text-white">{track.title}</div>
        <div className="mt-1 truncate text-xs text-[#b3b3b3]">{track.artist}</div>
      </div>
    </button>
  );
}
