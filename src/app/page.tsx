"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Play, Sparkles } from "lucide-react";

import { cn } from "@/lib/cn";
import { type Track, usePlayerStore } from "@/store/usePlayerStore";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type ApiTrack = { id: string; title: string; artist: string; thumbnail: string };

const categories = [
  "Chill",
  "Focus",
  "Commute",
  "Gaming",
  "Energize",
  "Party",
  "Feel good",
  "Romance",
  "Workout",
  "Sleep",
  "Sad",
  "Happy",
  "Nostalgia",
  "Acoustic",
  "Pop",
  "Rock",
] as const;

const hasThumb = (url?: string) => Boolean(url && /^https?:\/\//.test(url));

function TrackRail({
  title,
  tracks,
  onPlay,
}: {
  title: string;
  tracks: ApiTrack[];
  onPlay: (track: ApiTrack, queue: ApiTrack[]) => void;
}) {
  if (!tracks.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-black">{title}</h2>
        <span className="text-xs text-white/50">{tracks.length} tracks</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tracks.map((track) => (
          <button
            key={`${title}-${track.id}`}
            type="button"
            onClick={() => onPlay(track, tracks)}
            className="group rounded-2xl border border-white/10 bg-[#141723] p-3 text-left transition hover:border-violet-400/40 hover:bg-[#1a1f31]"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-500/20">
              {hasThumb(track.thumbnail) ? (
                <Image
                  src={track.thumbnail}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/70">
                  NO COVER
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white opacity-0 transition group-hover:opacity-100">
                <Play size={14} className="ml-0.5" />
              </div>
            </div>
            <p className="mt-2 truncate text-sm font-semibold">{track.title}</p>
            <p className="truncate text-xs text-white/60">{track.artist}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const { user } = useSupabaseAuth();
  const [activeCategory, setActiveCategory] = React.useState<(typeof categories)[number]>("Chill");
  const [region, setRegion] = React.useState<"Indonesia" | "Global" | "Trending">("Indonesia");

  const recommendationsQuery = useQuery({
    queryKey: ["home-recommendations", user?.id, activeCategory],
    queryFn: async () => {
      const res = await fetch(
        `/api/recommendations?userId=${encodeURIComponent(user?.id ?? "")}&mood=${encodeURIComponent(`${region} ${activeCategory}`)}`,
      );
      const body = (await res.json()) as { results?: ApiTrack[] };
      return (body.results ?? []).filter((track) => hasThumb(track.thumbnail));
    },
  });

  const recentQuery = useQuery({
    queryKey: ["home-recently-played", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/recently-played?userId=${encodeURIComponent(user?.id ?? "")}`);
      const body = (await res.json()) as {
        items?: Array<{ track_id: string; title: string; artist: string; thumbnail: string }>;
      };
      return (body.items ?? [])
        .map((item) => ({
          id: item.track_id,
          title: item.title,
          artist: item.artist,
          thumbnail: item.thumbnail,
        }))
        .filter((track) => hasThumb(track.thumbnail)) as ApiTrack[];
    },
  });

  const recommended = recommendationsQuery.data ?? [];
  const recentlyPlayed = recentQuery.data ?? [];
  const listenAgain = recentlyPlayed.length ? recentlyPlayed : recommended.slice(0, 12);
  const artistDiscovery = Array.from(new Map(recommended.map((track) => [track.artist, track])).values()).slice(0, 12);
  const highEnergy = recommended.slice(8, 20);

  return (
    <div className="min-h-full bg-[#07070b] px-4 pb-28 pt-6 md:px-6">
      <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-r from-violet-600/25 via-violet-500/10 to-cyan-400/20 p-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <Sparkles size={13} />
          Developer Profile
        </div>
        <h1 className="mt-3 text-4xl font-black leading-tight">Beranda</h1>
        <p className="mt-2 text-sm text-white/65">
          Rekomendasi dinamis versi kamu: personal, estetik, dan adaptif sesuai kebiasaan user.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["Indonesia", "Global", "Trending"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                region === item ? "bg-cyan-500 text-black" : "bg-white/10 text-white/70 hover:bg-white/20",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                activeCategory === category
                  ? "bg-violet-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {recommendationsQuery.isLoading ? (
        <div className="mb-4 text-sm text-white/60">Memuat rekomendasi {activeCategory.toLowerCase()}...</div>
      ) : null}

      <TrackRail title={`Dengarkan lagi • ${region}`} tracks={listenAgain.slice(0, 12)} onPlay={(track, queue) => playTrack(track as Track, queue as Track[])} />
      <TrackRail title={`Pilihan ${activeCategory}`} tracks={recommended.slice(0, 12)} onPlay={(track, queue) => playTrack(track as Track, queue as Track[])} />
      <TrackRail title="Perkenalan penyanyi baru" tracks={artistDiscovery} onPlay={(track, queue) => playTrack(track as Track, queue as Track[])} />
      <TrackRail title={`${region} • Sedang trending`} tracks={highEnergy} onPlay={(track, queue) => playTrack(track as Track, queue as Track[])} />

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-black">Profil artis pilihan</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {artistDiscovery.map((artistTrack) => (
            <button
              key={`artist-${artistTrack.artist}-${artistTrack.id}`}
              type="button"
              onClick={() => playTrack(artistTrack as Track, artistDiscovery as Track[])}
              className="rounded-2xl border border-white/10 bg-[#141723] p-3 text-left transition hover:border-violet-400/40"
            >
              <div className="relative mx-auto aspect-square w-full max-w-[120px] overflow-hidden rounded-full">
                <Image src={artistTrack.thumbnail} alt={artistTrack.artist} fill className="object-cover" sizes="120px" />
              </div>
              <p className="mt-2 truncate text-sm font-semibold">{artistTrack.artist}</p>
              <p className="truncate text-xs text-white/60">Lihat rekomendasi</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
