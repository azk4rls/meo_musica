"use client";

import React from "react";

import { supabase } from "@/lib/supabase";
import type { Track } from "@/store/usePlayerStore";

export function useFavorites(userId?: string) {
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);

  const refreshFavorites = React.useCallback(async () => {
    if (!userId || !supabase) {
      setFavoriteIds(new Set());
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select("track_id")
      .eq("user_id", userId);
    setLoading(false);

    const next = new Set<string>((data ?? []).map((row: { track_id: string }) => row.track_id));
    setFavoriteIds(next);
  }, [userId]);

  React.useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = React.useCallback(
    async (track: Track) => {
      if (!userId) return false;
      if (!supabase) return false;

      const isLiked = favoriteIds.has(track.id);
      if (isLiked) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("track_id", track.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
        return false;
      }

      await supabase.from("favorites").insert({
        user_id: userId,
        track_id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
      });
      setFavoriteIds((prev) => new Set(prev).add(track.id));
      return true;
    },
    [favoriteIds, userId],
  );

  return { favoriteIds, loading, toggleFavorite, refreshFavorites };
}
