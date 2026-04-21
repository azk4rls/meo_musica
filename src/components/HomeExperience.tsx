"use client";

import React from "react";
import Image from "next/image";
import { Play, Search, Flame, Globe2, TrendingUp, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { type Track, usePlayerStore } from "@/store/usePlayerStore";

type SearchResponse = { results: Track[]; error?: string };
type HomeSection = { title: string; query: string; layout: "circle" | "grid" | "list"; tracks: Track[] };

const regionTabs = [
  { label: "Indonesia", icon: <span className="text-base">🇮🇩</span> },
  { label: "Global", icon: <Globe2 size={14} /> },
  { label: "Trending", icon: <TrendingUp size={14} /> },
];

const moods = [
  { label: "Chill", color: "#6366f1" },
  { label: "Focus", color: "#0ea5e9" },
  { label: "Commute", color: "#f59e0b" },
  { label: "Gaming", color: "#10b981" },
  { label: "Energize", color: "#ef4444" },
  { label: "Party", color: "#ec4899" },
  { label: "Feel good", color: "#f97316" },
  { label: "Romance", color: "#e879f9" },
  { label: "Workout", color: "#84cc16" },
  { label: "Sleep", color: "#818cf8" },
  { label: "Sad", color: "#64748b" },
  { label: "Happy", color: "#facc15" },
  { label: "Nostalgia", color: "#fb923c" },
  { label: "Acoustic", color: "#a78bfa" },
  { label: "Pop", color: "#f43f5e" },
  { label: "Rock", color: "#475569" },
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
  const [activeRegion, setActiveRegion] = React.useState("Indonesia");
  const [activeMood, setActiveMood] = React.useState<string | null>(null);
  const [sections, setSections] = React.useState<HomeSection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchFocused, setSearchFocused] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const moodQuery = activeMood ? `${activeMood} music mix` : `Top ${activeRegion} hits`;
        const allBlueprints = [
          { title: "Dibuat untuk kamu", query: moodQuery, layout: "grid" as const },
          ...sectionBlueprints,
        ];
        const payload = await Promise.all(
          allBlueprints.map(async (item) => ({
            ...item,
            tracks: await fetchTracks(item.query),
          }))
        );
        if (!cancelled) setSections(payload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [activeMood, activeRegion]);

  const searchResults = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const merged = sections.flatMap((s) => s.tracks);
    const deduped = Array.from(new Map(merged.map((t) => [t.id, t])).values());
    return deduped.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }, [search, sections]);

  const activeMoodColor = moods.find((m) => m.label === activeMood)?.color ?? "#e11d48";

  return (
    <div className="min-h-full bg-[#0e0e0e] pb-10 font-sans">
      {/* ── TOP HEADER ── */}
      <div
        className="relative overflow-hidden px-5 pb-6 pt-5 sm:px-8"
        style={{
          background: activeMood
            ? `linear-gradient(160deg, ${activeMoodColor}28 0%, #0e0e0e 60%)`
            : "linear-gradient(160deg, #1c0a1e 0%, #0e0e0e 60%)",
          transition: "background 0.6s ease",
        }}
      >
        {/* decorative blobs */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-20"
          style={{ background: activeMoodColor, transition: "background 0.6s ease" }}
        />
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full blur-3xl opacity-10 bg-fuchsia-500" />

        {/* Dev badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/50 uppercase">
          <Flame size={11} className="text-orange-400" />
          Developer Profile
        </div>

        {/* Title */}
        <h1
          className="text-4xl font-black tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "'Syne', 'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}
        >
          Beranda
        </h1>
        <p className="mt-1.5 text-sm text-white/40 font-light max-w-xs">
          Rekomendasi dinamis versi kamu: personal, estetik, dan adaptif sesuai kebiasaan user.
        </p>

        {/* Region tabs */}
        <div className="mt-5 flex items-center gap-2">
          {regionTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveRegion(tab.label)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                activeRegion === tab.label
                  ? "bg-white text-black shadow-md"
                  : "bg-white/8 text-white/60 hover:bg-white/14 hover:text-white"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div
          className={cn(
            "relative mt-5 flex max-w-lg items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300",
            searchFocused
              ? "border-white/20 bg-white/8 shadow-lg shadow-black/40"
              : "border-white/8 bg-white/5"
          )}
        >
          <Search size={16} className="shrink-0 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Cari lagu, artis, atau album…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-white/30 hover:text-white transition text-xs">✕</button>
          )}
        </div>

        {/* Mood pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {moods.map((mood) => {
            const active = activeMood === mood.label;
            return (
              <button
                key={mood.label}
                type="button"
                onClick={() => setActiveMood(active ? null : mood.label)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border",
                  active
                    ? "text-white border-transparent shadow-md"
                    : "bg-white/5 border-white/8 text-white/55 hover:bg-white/10 hover:text-white/80"
                )}
                style={active ? { backgroundColor: mood.color, borderColor: mood.color } : {}}
              >
                {mood.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-5 pt-4 sm:px-8">
        {error ? <div className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}

        {search.trim() ? (
          <section>
            <SectionHeader title="Hasil pencarian" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {searchResults.length === 0 ? (
                <p className="col-span-5 py-10 text-center text-sm text-white/30">Tidak ada hasil ditemukan.</p>
              ) : searchResults.map((track) => (
                <TrackCard key={track.id} track={track} onPlay={() => playTrack(track, searchResults)} />
              ))}
            </div>
          </section>
        ) : (
          <div className="space-y-12">
            {loading ? (
              <SkeletonGrid />
            ) : (
              sections.map((section) => (
                <section key={section.title}>
                  <SectionHeader title={section.title} />

                  {section.layout === "circle" && (
                    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                      {section.tracks.slice(0, 12).map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => playTrack(track, section.tracks)}
                          className="group text-left"
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded-full ring-2 ring-white/0 transition-all group-hover:ring-white/20 group-hover:scale-105">
                            <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="180px" />
                          </div>
                          <div className="mt-2 truncate text-center text-xs font-semibold text-white/80">{track.title}</div>
                          <div className="truncate text-center text-[10px] text-white/35">{track.artist}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {section.layout === "grid" && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {section.tracks.slice(0, 15).map((track) => (
                        <TrackCard key={track.id} track={track} onPlay={() => playTrack(track, section.tracks)} />
                      ))}
                    </div>
                  )}

                  {section.layout === "list" && (
                    <div className="divide-y divide-white/5 rounded-2xl overflow-hidden bg-white/3">
                      {section.tracks.slice(0, 12).map((track, i) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => playTrack(track, section.tracks)}
                          className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-white/6"
                        >
                          <span className="w-5 shrink-0 text-center text-xs text-white/20 tabular-nums">{i + 1}</span>
                          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                            <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="64px" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-white/90">{track.title}</div>
                            <div className="truncate text-xs text-white/35">{track.artist}</div>
                          </div>
                          <ChevronRight size={14} className="shrink-0 text-white/15" />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2
        className="text-lg font-bold text-white/90 tracking-tight"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {title}
      </h2>
      <button type="button" className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition">
        Lihat semua <ChevronRight size={12} />
      </button>
    </div>
  );
}

function TrackCard({ track, onPlay }: { track: Track; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group rounded-xl bg-white/4 p-3 text-left transition-all duration-200 hover:bg-white/8 hover:scale-[1.02]"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image src={track.thumbnail} alt={track.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="220px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="absolute bottom-2.5 right-2.5 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <Play size={14} className="ml-0.5" fill="black" />
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="truncate text-sm font-semibold text-white/90">{track.title}</div>
        <div className="truncate text-xs text-white/35">{track.artist}</div>
      </div>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-12">
      {[1, 2].map((s) => (
        <section key={s}>
          <div className="mb-4 h-5 w-40 animate-pulse rounded-full bg-white/8" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/4 p-3">
                <div className="aspect-square animate-pulse rounded-lg bg-white/8" />
                <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-white/8" />
                <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}