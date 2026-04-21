"use client";

import React from "react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { usePlayerStore } from "@/store/usePlayerStore";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function YouTubePlayerEngine() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const volume = usePlayerStore((s) => s.volume);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const pendingSeek = usePlayerStore((s) => s.pendingSeek);
  const updateTime = usePlayerStore((s) => s.updateTime);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setBuffering = usePlayerStore((s) => s.setBuffering);
  const { user } = useSupabaseAuth();

  const playerRef = React.useRef<any>(null);
  const rafRef = React.useRef<number | null>(null);
  const previousTrackIdRef = React.useRef<string | null>(null);
  const persistedTrackRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const startRaf = () => {
      const tick = () => {
        const player = playerRef.current;
        if (player && typeof player.getCurrentTime === "function") {
          const current = Math.floor(player.getCurrentTime() || 0);
          const duration = Math.floor(player.getDuration?.() || 0);
          const buffered = Math.floor(player.getVideoLoadedFraction?.() * duration || 0);
          updateTime(current, duration, buffered);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const stopRaf = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || playerRef.current) return;
      playerRef.current = new window.YT.Player("yt-engine-player", {
        height: "0",
        width: "0",
        playerVars: { autoplay: 0, controls: 0, playsinline: 1, rel: 0 },
        events: {
          onReady: () => startRaf(),
          onStateChange: (event: any) => {
            const state = event.data;
            setBuffering(state === window.YT.PlayerState.BUFFERING);
            if (state === window.YT.PlayerState.ENDED) skipNext();
          },
          onError: () => skipNext(),
        },
      });
    };

    const scriptId = "youtube-iframe-api";
    if (document.getElementById(scriptId)) {
      if (window.YT?.Player) initPlayer();
      else window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => stopRaf();
  }, [setBuffering, skipNext, updateTime]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentTrack?.id) return;
    if (previousTrackIdRef.current === currentTrack.id) return;
    previousTrackIdRef.current = currentTrack.id;
    player.loadVideoById(currentTrack.id);
  }, [currentTrack?.id]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player?.playVideo) return;
    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isPlaying]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player?.setVolume) return;
    player.setVolume(Math.floor(volume * 100));
  }, [volume]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isMuted) player.mute();
    else player.unMute();
  }, [isMuted]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player?.setPlaybackRate) return;
    try {
      player.setPlaybackRate(playbackRate);
    } catch {
      // ignore unsupported rates
    }
  }, [playbackRate]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player?.seekTo || pendingSeek === null) return;
    player.seekTo(pendingSeek, true);
    usePlayerStore.setState({ pendingSeek: null });
  }, [pendingSeek]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player?.getDuration) return;
    const duration = Math.floor(player.getDuration() || 0);
    setDuration(duration);
  }, [currentTrack?.id, setDuration]);

  React.useEffect(() => {
    if (!user?.id || !currentTrack?.id) return;
    if (persistedTrackRef.current === currentTrack.id) return;
    persistedTrackRef.current = currentTrack.id;
    fetch("/api/recently-played", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        track: {
          id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          thumbnail: currentTrack.thumbnail,
        },
      }),
    }).catch(() => {});
  }, [currentTrack?.artist, currentTrack?.id, currentTrack?.thumbnail, currentTrack?.title, user?.id]);

  return <div id="yt-engine-player" className="hidden" />;
}
