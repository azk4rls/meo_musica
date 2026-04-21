"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Play, Plus } from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { cn } from "@/lib/cn";
import { type Track, usePlayerStore } from "@/store/usePlayerStore";

type Tab = "liked" | "recent" | "playlists";
const validThumb = (url?: string) => Boolean(url && /^https?:\/\//.test(url));

export default function LibraryPage() {
  const { user, signInWithGoogle, isSupabaseConfigured } = useSupabaseAuth();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [tab, setTab] = React.useState<Tab>("liked");
  const [newPlaylistName, setNewPlaylistName] = React.useState("");

  const likesQuery = useQuery({
    queryKey: ["likes", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/like?userId=${encodeURIComponent(user?.id ?? "")}`);
      const data = (await res.json()) as {
        likes?: Array<{ track_id: string; title: string; artist: string; thumbnail: string }>;
      };
      return (data.likes ?? []).map((row) => ({
        id: row.track_id,
        title: row.title,
        artist: row.artist,
        thumbnail: row.thumbnail,
      })) as Track[];
    },
  });

  const recentQuery = useQuery({
    queryKey: ["recent", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/recently-played?userId=${encodeURIComponent(user?.id ?? "")}`);
      const data = (await res.json()) as {
        items?: Array<{ track_id: string; title: string; artist: string; thumbnail: string }>;
      };
      return (data.items ?? []).map((row) => ({
        id: row.track_id,
        title: row.title,
        artist: row.artist,
        thumbnail: row.thumbnail,
      })) as Track[];
    },
  });

  const playlistsQuery = useQuery({
    queryKey: ["playlists", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/playlist?userId=${encodeURIComponent(user?.id ?? "")}`);
      return (await res.json()) as {
        playlists?: Array<{
          id: string;
          name: string;
          playlist_tracks: Array<{ track_id: string; title: string; artist: string; thumbnail: string }>;
        }>;
      };
    },
  });

  const createPlaylist = async () => {
    if (!user?.id || !newPlaylistName.trim()) return;
    await fetch("/api/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        name: newPlaylistName.trim(),
      }),
    });
    setNewPlaylistName("");
    await playlistsQuery.refetch();
  };

  const likedTracks = likesQuery.data ?? [];
  const recentTracks = recentQuery.data ?? [];
  const playlists = playlistsQuery.data?.playlists ?? [];

  return (
    <div className="min-h-full bg-[#07070b] px-4 pb-28 pt-6 md:px-6">
      <div className="mb-6 rounded-3xl border border-white/10 bg-[#151722] p-5">
        <h1 className="text-4xl font-black">Library</h1>
        <p className="mt-1 text-sm text-white/60">Semua yang kamu simpan dan sering didengar.</p>
        {!user ? (
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={!isSupabaseConfigured}
            className="mt-3 rounded-full bg-violet-500 px-4 py-2 text-xs font-semibold disabled:opacity-60"
          >
            {isSupabaseConfigured ? "Sign in untuk sinkronisasi" : "Setup Supabase dulu"}
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex gap-2">
        {(["liked", "recent", "playlists"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold uppercase",
              tab === item ? "bg-violet-500 text-white" : "bg-white/10 text-white/70",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "playlists" ? (
        <div className="mb-4 rounded-xl border border-white/10 bg-[#151722] p-3">
          <div className="flex gap-2">
            <input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Nama playlist baru"
              className="flex-1 rounded-lg bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <button type="button" onClick={() => void createPlaylist()} className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 text-sm font-semibold">
              <Plus size={15} />
              Create
            </button>
          </div>
        </div>
      ) : null}

      {tab === "liked" ? <TrackGrid tracks={likedTracks} onPlay={playTrack} /> : null}
      {tab === "recent" ? <TrackGrid tracks={recentTracks} onPlay={playTrack} /> : null}
      {tab === "playlists" ? (
        <div className="space-y-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="rounded-xl border border-white/10 bg-[#151722] p-3">
              <div className="mb-2 text-lg font-bold">{playlist.name}</div>
              <TrackGrid
                tracks={playlist.playlist_tracks.map((t) => ({
                  id: t.track_id,
                  title: t.title,
                  artist: t.artist,
                  thumbnail: t.thumbnail,
                }))}
                onPlay={playTrack}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TrackGrid({
  tracks,
  onPlay,
}: {
  tracks: Track[];
  onPlay: (track: Track, queue?: Track[]) => void;
}) {
  if (!tracks.length) return <div className="rounded-xl bg-[#151722] p-4 text-sm text-white/60">Belum ada data.</div>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tracks.map((track) => (
        <button
          key={track.id}
          type="button"
          onClick={() => onPlay(track, tracks)}
          className="group rounded-xl bg-[#11131d] p-3 text-left transition hover:bg-white/10"
        >
          <div className="relative aspect-square overflow-hidden rounded-lg">
            {validThumb(track.thumbnail) ? (
              <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="220px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-[11px] font-semibold text-white/70">
                NO COVER
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white opacity-0 transition group-hover:opacity-100">
              <Play size={15} className="ml-0.5" />
            </div>
          </div>
          <p className="mt-2 truncate text-sm font-semibold">{track.title}</p>
          <p className="truncate text-xs text-white/60">{track.artist}</p>
        </button>
      ))}
    </div>
  );
}
