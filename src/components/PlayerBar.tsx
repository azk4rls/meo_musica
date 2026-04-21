"use client";

import Image from "next/image";
import {
  Captions,
  ChevronDown,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { usePlayerStore } from "@/store/usePlayerStore";

function formatTime(value: number) {
  const total = Math.floor(value || 0);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function PlayerBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const skipBack = usePlayerStore((s) => s.skipBack);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const togglePlayer = usePlayerStore((s) => s.togglePlayer);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const setShuffle = usePlayerStore((s) => s.setShuffle);

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 hidden border-t border-white/10 bg-[#07070b] md:block">
      <div className="grid h-[88px] grid-cols-1 items-center gap-3 px-4 md:grid-cols-[1fr_1.4fr_1fr]">
        <button type="button" onClick={togglePlayer} className="hidden min-w-0 items-center gap-3 text-left md:flex">
          <div className="relative h-12 w-12 overflow-hidden rounded">
            <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" sizes="48px" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{currentTrack.title}</div>
            <div className="truncate text-xs text-white/60">{currentTrack.artist}</div>
          </div>
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button type="button" onClick={skipBack} className="text-white/70 hover:text-white">
              <SkipBack size={18} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button type="button" onClick={skipNext} className="text-white/70 hover:text-white">
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2">
            <span className="w-10 text-right text-[11px] text-white/60">{formatTime(currentTime)}</span>
            <div className="relative h-1.5 w-full rounded-full bg-white/20">
              <div className="absolute inset-y-0 left-0 rounded-full bg-[#7c3aed]" style={{ width: `${progress}%` }} />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                aria-label="Seek"
              />
            </div>
            <span className="w-10 text-[11px] text-white/60">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden items-center justify-end gap-2 md:flex">
          <button
            type="button"
            onClick={() =>
              setRepeatMode(
                repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off",
              )
            }
            className={cn("rounded p-1.5", repeatMode !== "off" ? "text-violet-400" : "text-white/70")}
            aria-label="Repeat mode"
          >
            <Repeat size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShuffle(!shuffle)}
            className={cn("rounded p-1.5", shuffle ? "text-violet-400" : "text-white/70")}
            aria-label="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button type="button" className="rounded p-1.5 text-white/70" aria-label="Captions">
            <Captions size={16} />
          </button>
          <Volume2 size={16} className="text-white/70" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-28 accent-white"
            aria-label="Volume"
          />
          <button type="button" onClick={togglePlayer} className="rounded p-1.5 text-white/70" aria-label="Expand player">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
