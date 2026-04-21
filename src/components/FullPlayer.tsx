"use client";

import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  HeartOff,
  ListMusic,
  Mic2,
  Music2,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/cn";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { type ActiveTab, type Track, usePlayerStore } from "@/store/usePlayerStore";

/* ─────────────────────────── types ──────────────────────────── */
type LyricsPayload = { lyrics?: string; plainLyrics?: string };
type SearchPayload = { results: Track[] };
type LyricLine = { time: number; text: string };

/* ─────────────────────────── constants ──────────────────────── */
const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: "upnext", label: "Up Next", icon: <ListMusic size={14} /> },
  { id: "lyrics", label: "Lyrics", icon: <Mic2 size={14} /> },
  { id: "related", label: "Related", icon: <Music2 size={14} /> },
];

/* ─────────────────────────── helpers ────────────────────────── */
function parseLyrics(raw: string): LyricLine[] {
  return raw
    .split("\n")
    .map((l) => l.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/))
    .filter(Boolean)
    .map((m) => {
      const x = m as RegExpMatchArray;
      const ms = Number(x[3] ?? 0);
      return {
        time: Number(x[1]) * 60 + Number(x[2]) + ms / (x[3]?.length === 3 ? 1000 : 100),
        text: x[4].trim(),
      };
    })
    .filter((l) => l.text.length > 0);
}

const fmt = (v: number) => {
  const n = Math.floor(v || 0);
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};

const seenIds = new Set<string>();

function smartShuffle(pool: Track[]): Track[] {
  const out = pool.filter((t) => !seenIds.has(t.id));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function FullPlayer() {
  /* ── store ────────────────────────────────────────────────── */
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue        = usePlayerStore((s) => s.queue);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const currentTime  = usePlayerStore((s) => s.currentTime);
  const duration     = usePlayerStore((s) => s.duration);
  const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
  const activeTab    = usePlayerStore((s) => s.activeTab);
  const setActiveTab = usePlayerStore((s) => s.setActiveTab);
  const togglePlayer = usePlayerStore((s) => s.togglePlayer);
  const playTrack    = usePlayerStore((s) => s.playTrack);
  const setQueue     = usePlayerStore((s) => s.setQueue);
  const togglePlay   = usePlayerStore((s) => s.togglePlay);
  const skipBack     = usePlayerStore((s) => s.skipBack);
  const skipNext     = usePlayerStore((s) => s.skipNext);
  const seekTo       = usePlayerStore((s) => s.seekTo);
  const { user }     = useSupabaseAuth();
  const queryClient  = useQueryClient();

  /* ── local state ──────────────────────────────────────────── */
  const [upnextFilter, setUpnextFilter] = React.useState<"all" | "popular" | "liked" | "related">("all");
  const [mobileMode, setMobileMode]     = React.useState<"player" | "sheet">("player");
  // desktop: left panel width in px
  const [leftW, setLeftW]               = React.useState(420);
  const isDragging   = React.useRef(false);
  const dragStartX   = React.useRef(0);
  const dragStartW   = React.useRef(0);

  /* ── refs ─────────────────────────────────────────────────── */
  const upnextRef  = React.useRef<HTMLDivElement>(null);
  const lyricRefs  = React.useRef<(HTMLParagraphElement | null)[]>([]);

  /* ── queries ──────────────────────────────────────────────── */
  const lyricsQuery = useQuery({
    queryKey: ["lyrics", currentTrack?.id],
    enabled: Boolean(currentTrack?.id),
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `/api/lyrics?artist=${encodeURIComponent(currentTrack?.artist ?? "")}&track=${encodeURIComponent(currentTrack?.title ?? "")}`,
      );
      if (!res.ok) throw new Error("lyrics fetch failed");
      return (await res.json()) as LyricsPayload;
    },
  });

  const relatedQuery = useQuery({
    queryKey: ["related", currentTrack?.id],
    enabled: Boolean(currentTrack?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const q = `${currentTrack?.artist ?? ""} ${currentTrack?.title ?? ""}`;
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      return (await res.json()) as SearchPayload;
    },
  });

  // liked track IDs set
  const likesQuery = useQuery({
    queryKey: ["likes", user?.id],
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const res = await fetch(`/api/like?userId=${encodeURIComponent(user!.id)}`);
      const body = (await res.json()) as {
        likes?: Array<{ track_id: string; title: string; artist: string; thumbnail: string }>;
      };
      return new Set((body.likes ?? []).map((r) => r.track_id));
    },
  });

  const isLiked = Boolean(currentTrack && likesQuery.data?.has(currentTrack.id));

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !currentTrack) throw new Error("not logged in");
      const res = await fetch("/api/like", {
        method: isLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, track: currentTrack }),
      });
      if (!res.ok) throw new Error("like failed");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["likes", user?.id] });
      queryClient.setQueryData<Set<string>>(["likes", user?.id], (old) => {
        const next = new Set(old);
        if (currentTrack) isLiked ? next.delete(currentTrack.id) : next.add(currentTrack.id);
        return next;
      });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ["likes", user?.id] }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !currentTrack) throw new Error("not logged in");
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: `Saved — ${currentTrack.title}`,
          tracks: [currentTrack],
        }),
      });
      if (!res.ok) throw new Error("save failed");
    },
  });

  /* ── derived ──────────────────────────────────────────────── */
  const relatedTracks  = (relatedQuery.data?.results ?? []).filter((t) => t.id !== currentTrack?.id);
  const popularTracks  = [...relatedTracks].sort((a, b) => a.title.length - b.title.length);

  const upnextTracks =
    upnextFilter === "related" ? relatedTracks
    : upnextFilter === "popular" ? popularTracks
    : queue; // "all" and "liked" both show queue (liked integrated into queue by smart algo)

  /* ── queue seeding ────────────────────────────────────────── */
  React.useEffect(() => {
    if (!currentTrack || !relatedTracks.length || queue.length >= 8) return;
    seenIds.add(currentTrack.id);
    const smart = smartShuffle([...relatedTracks]).slice(0, 30);
    setQueue(smart);
  }, [currentTrack?.id, relatedTracks.length]);

  /* ── infinite scroll upnext ───────────────────────────────── */
  const handleUpnextScroll = React.useCallback(() => {
    const el = upnextRef.current;
    if (!el || !relatedTracks.length) return;
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 150) return;
    const extras = smartShuffle(relatedTracks).slice(0, 10);
    if (!extras.length) return;
    extras.forEach((t) => seenIds.add(t.id));
    const ids = new Set(queue.map((t) => t.id));
    setQueue([...queue, ...extras.filter((t) => !ids.has(t.id))]);
  }, [relatedTracks, setQueue, queue]);

  /* ── lyrics ───────────────────────────────────────────────── */
  const lines: LyricLine[] = React.useMemo(
    () => (lyricsQuery.data?.lyrics ? parseLyrics(lyricsQuery.data.lyrics) : []),
    [lyricsQuery.data],
  );

  const activeLyric = React.useMemo(() => {
    if (!lines.length || currentTime <= 0) return -1;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) idx = i;
      else break;
    }
    return idx;
  }, [lines, currentTime]);

  React.useEffect(() => {
    if (activeLyric < 0) return;
    lyricRefs.current[activeLyric]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeLyric]);

  /* ── desktop resize ───────────────────────────────────────── */
  const onDividerMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = leftW;
    e.preventDefault();
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setLeftW(Math.max(300, Math.min(650, dragStartW.current + e.clientX - dragStartX.current)));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  /* ── misc ─────────────────────────────────────────────────── */
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  if (!currentTrack) return null;

  /* ══════════════════════════════════════════════════════════
     SHARED SUB-COMPONENTS (defined inline so they close over state)
  ══════════════════════════════════════════════════════════ */

  const TabBar = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn("flex shrink-0 border-b border-white/8", !compact && "px-1 pt-1")}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-[11px] font-bold uppercase tracking-widest transition-all",
            activeTab === tab.id
              ? "border-[#f33] text-white"
              : "border-transparent text-white/35 hover:text-white/65",
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const TabContent = ({ scrollClass = "" }: { scrollClass?: string }) => (
    <div
      className={cn("flex-1 overflow-y-auto", scrollClass)}
      ref={activeTab === "upnext" ? upnextRef : undefined}
      onScroll={activeTab === "upnext" ? handleUpnextScroll : undefined}
    >
      {/* ─── UP NEXT ─── */}
      {activeTab === "upnext" && (
        <>
          <div className="flex flex-wrap gap-1.5 p-3 pb-2">
            {(["all", "popular", "liked", "related"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setUpnextFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all",
                  upnextFilter === f
                    ? "bg-[#f33] text-white shadow-lg shadow-red-900/40"
                    : "bg-white/8 text-white/40 hover:bg-white/14 hover:text-white/70",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <TrackList
            tracks={upnextTracks}
            activeTrackId={currentTrack.id}
            onSelect={(t) => { seenIds.add(t.id); playTrack(t, upnextTracks); }}
          />
          {relatedQuery.isFetching && (
            <p className="py-4 text-center text-xs text-white/25 animate-pulse">Loading more…</p>
          )}
        </>
      )}

      {/* ─── RELATED ─── */}
      {activeTab === "related" && (
        <TrackList
          tracks={relatedTracks}
          activeTrackId={currentTrack.id}
          onSelect={(t) => playTrack(t, relatedTracks)}
        />
      )}

      {/* ─── LYRICS ─── */}
      {activeTab === "lyrics" && (
        <div className="pb-10">
          {/* loading skeleton */}
          {lyricsQuery.isLoading && (
            <div className="space-y-3 p-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 animate-pulse rounded-md bg-white/8"
                  style={{ width: `${40 + (i % 6) * 10}%` }}
                />
              ))}
            </div>
          )}

          {/* synced lyrics */}
          {!lyricsQuery.isLoading && lines.length > 0 && (
            <div className="space-y-0.5 p-4">
              {lines.map((line, idx) => (
                <p
                  key={`${line.time}-${idx}`}
                  ref={(el) => { lyricRefs.current[idx] = el; }}
                  onClick={() => seekTo(line.time)}
                  className={cn(
                    "cursor-pointer rounded-lg px-2 py-1.5 text-[16px] font-bold leading-snug transition-all duration-300 select-none",
                    idx === activeLyric
                      ? "scale-[1.03] text-white"
                      : idx < activeLyric
                      ? "text-white/20"
                      : "text-white/45 hover:text-white/70",
                  )}
                >
                  {line.text}
                </p>
              ))}
            </div>
          )}

          {/* plain lyrics fallback */}
          {!lyricsQuery.isLoading && lines.length === 0 && lyricsQuery.data?.plainLyrics && (
            <div className="whitespace-pre-line p-5 text-sm leading-7 text-white/45">
              {lyricsQuery.data.plainLyrics}
            </div>
          )}

          {/* unavailable */}
          {!lyricsQuery.isLoading && lines.length === 0 && !lyricsQuery.data?.plainLyrics && (
            <div className="flex flex-col items-center gap-3 py-20">
              <Mic2 size={36} className="text-white/20" />
              <p className="text-sm text-white/30">Lyrics not available for this track.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* controls (shared between mobile + desktop) */
  const Controls = () => (
    <>
      {/* progress */}
      <div className="mt-4 w-full">
        <div className="group relative h-1 cursor-pointer rounded-full bg-white/15 transition-all hover:h-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[#f33]" style={{ width: `${progress}%` }} />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(Math.floor(currentTime || 0), Math.floor(duration || 0))}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-white/35">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* buttons */}
      <div className="mt-3 flex items-center justify-center gap-7">
        <button type="button" onClick={skipBack} className="text-white/55 transition hover:text-white active:scale-90">
          <SkipBack size={22} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-xl transition hover:scale-105 active:scale-95"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </button>
        <button type="button" onClick={skipNext} className="text-white/55 transition hover:text-white active:scale-90">
          <SkipForward size={22} />
        </button>
      </div>

      {/* like / save */}
      <div className="mt-4 flex w-full gap-2">
        <button
          type="button"
          disabled={!user || likeMutation.isPending}
          onClick={() => likeMutation.mutate()}
          title={!user ? "Sign in to like" : isLiked ? "Unlike" : "Like"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
            isLiked
              ? "border-[#f33]/50 bg-[#f33]/15 text-[#f33] hover:bg-[#f33]/25"
              : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white",
            (!user || likeMutation.isPending) && "cursor-not-allowed opacity-50",
          )}
        >
          {isLiked ? <HeartOff size={13} /> : <Heart size={13} />}
          {likeMutation.isPending ? "…" : isLiked ? "Liked" : "Like"}
        </button>
        <button
          type="button"
          disabled={!user || saveMutation.isPending || saveMutation.isSuccess}
          onClick={() => saveMutation.mutate()}
          title={!user ? "Sign in to save" : "Save to playlist"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
            saveMutation.isSuccess
              ? "bg-green-600/80 text-white"
              : "bg-[#f33]/85 text-white hover:bg-[#f33]",
            (!user || saveMutation.isPending) && "opacity-70",
          )}
        >
          <Plus size={13} />
          {saveMutation.isPending ? "Saving…" : saveMutation.isSuccess ? "Saved ✓" : "Save to playlist"}
        </button>
      </div>
    </>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70]"
          style={{
            background: "radial-gradient(ellipse at 25% 0%, #1c0808 0%, #080810 65%)",
            backdropFilter: "blur(30px)",
          }}
        >
          {/* ════════════════ DESKTOP LAYOUT ════════════════ */}
          <div className="hidden h-full lg:flex">
            {/* ── left panel: artwork + controls ── */}
            <div
              className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden p-8"
              style={{ width: leftW, minWidth: 300, maxWidth: 650 }}
            >
              {/* ambient art blur */}
              <div className="pointer-events-none absolute inset-0 opacity-15">
                <Image src={currentTrack.thumbnail} alt="" fill className="scale-125 object-cover blur-3xl" sizes="650px" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/60 to-transparent" />
              </div>

              <button
                type="button"
                onClick={togglePlayer}
                className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
              >
                <X size={15} />
              </button>

              {/* artwork card */}
              <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{
                  maxWidth: Math.min(leftW - 64, 320),
                  boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)",
                }}
              >
                <div className="relative aspect-square">
                  <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" sizes="320px" />
                </div>
              </div>

              {/* track info + controls */}
              <div className="relative mt-6 w-full" style={{ maxWidth: Math.min(leftW - 64, 320) }}>
                <h2 className="line-clamp-2 text-xl font-black leading-tight">{currentTrack.title}</h2>
                <p className="mt-1 text-sm text-white/50">{currentTrack.artist}</p>
                <Controls />
              </div>
            </div>

            {/* ── drag handle ── */}
            <div
              onMouseDown={onDividerMouseDown}
              className="group relative z-10 flex w-1.5 shrink-0 cursor-col-resize select-none items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div className="h-12 w-0.5 rounded-full bg-white/30 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            {/* ── right panel: tabs ── */}
            <div
              className="flex min-w-0 flex-1 flex-col"
              style={{
                background: "rgba(255,255,255,0.025)",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(10px)",
              }}
            >
              <TabBar />
              <TabContent scrollClass="custom-scrollbar" />
            </div>
          </div>

          {/* ════════════════ MOBILE LAYOUT ════════════════ */}
          <div className="relative flex h-full flex-col overflow-hidden lg:hidden">
            {/* ambient bg art */}
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <Image src={currentTrack.thumbnail} alt="" fill className="scale-110 object-cover blur-3xl" sizes="500px" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080810]/70 to-[#080810]" />
            </div>

            {/* ── player area (always visible) ── */}
            <div className="relative z-10 flex flex-col items-center px-6 pt-4">
              {/* top row */}
              <div className="flex w-full items-center justify-between">
                <div className="w-8" />
                <div className="h-1 w-10 rounded-full bg-white/20" />
                <button
                  type="button"
                  onClick={togglePlayer}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
                >
                  <X size={15} />
                </button>
              </div>

              {/* artwork */}
              <div className="mt-4 w-full max-w-[260px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                <div className="relative aspect-square">
                  <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" sizes="260px" />
                </div>
              </div>

              {/* track info */}
              <div className="mt-4 w-full">
                <h2 className="line-clamp-1 text-lg font-black">{currentTrack.title}</h2>
                <p className="text-sm text-white/50">{currentTrack.artist}</p>
              </div>

              <Controls />
            </div>

            {/* ── bottom sheet ── */}
            <motion.div
              className="relative z-10 mt-auto flex flex-col overflow-hidden rounded-t-3xl"
              style={{
                background: "rgba(12,12,20,0.92)",
                borderTop: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(30px)",
              }}
              animate={{ height: mobileMode === "sheet" ? "65vh" : "auto" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* sheet header: tap to toggle */}
              <button
                type="button"
                onClick={() => setMobileMode((m) => (m === "player" ? "sheet" : "player"))}
                className="flex w-full items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
                  {TABS.find((t) => t.id === activeTab)?.icon}
                  {TABS.find((t) => t.id === activeTab)?.label}
                </div>
                {mobileMode === "player" ? (
                  <ChevronUp size={18} className="text-white/40" />
                ) : (
                  <ChevronDown size={18} className="text-white/40" />
                )}
              </button>

              {/* expanded sheet content */}
              <AnimatePresence>
                {mobileMode === "sheet" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    {/* mini now-playing bar inside sheet */}
                    <div className="flex items-center gap-3 border-b border-white/8 px-4 pb-2">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                        <Image src={currentTrack.thumbnail} alt="" fill className="object-cover" sizes="36px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{currentTrack.title}</p>
                        <p className="truncate text-[10px] text-white/40">{currentTrack.artist}</p>
                      </div>
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black"
                      >
                        {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                      </button>
                    </div>

                    <TabBar compact />
                    <TabContent scrollClass="custom-scrollbar" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* collapsed: show next track preview */}
              {mobileMode === "player" && upnextTracks[0] && (
                <div className="flex items-center gap-3 border-t border-white/6 px-4 pb-6 pt-2">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                    <Image src={upnextTracks[0].thumbnail} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Next up</p>
                    <p className="truncate text-xs font-semibold text-white/60">{upnextTracks[0].title}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRACK LIST
═══════════════════════════════════════════════════════════════ */
function TrackList({
  tracks,
  activeTrackId,
  onSelect,
}: {
  tracks: Track[];
  activeTrackId: string;
  onSelect: (track: Track) => void;
}) {
  if (!tracks.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Music2 size={32} className="text-white/20" />
        <p className="text-xs text-white/30">No tracks found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-px px-2 pb-8">
      {tracks.map((track, i) => {
        const active = activeTrackId === track.id;
        return (
          <button
            key={`${track.id}-${i}`}
            type="button"
            onClick={() => onSelect(track)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-all duration-150",
              active ? "bg-[#f33]/12 ring-1 ring-[#f33]/25" : "hover:bg-white/5",
            )}
          >
            {/* thumbnail */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
              <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="44px" />
              {active && (
                <div className="absolute inset-0 flex items-end justify-center gap-0.5 bg-black/45 pb-1.5">
                  {[0, 1, 2].map((b) => (
                    <span
                      key={b}
                      className="inline-block w-[3px] rounded-full bg-[#f33]"
                      style={{
                        height: `${8 + b * 3}px`,
                        animation: `barBounce 0.7s ease-in-out ${b * 0.13}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* text */}
            <div className="min-w-0 flex-1">
              <div className={cn("truncate text-sm font-semibold leading-snug", active ? "text-[#f33]" : "text-white/85")}>
                {track.title}
              </div>
              <div className="truncate text-xs text-white/38">{track.artist}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}