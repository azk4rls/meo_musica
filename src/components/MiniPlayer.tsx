"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";

import { usePlayerStore } from "@/store/usePlayerStore";

export function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const togglePlayer = usePlayerStore((s) => s.togglePlayer);

  if (!currentTrack) return null;

  return (
    <button
      type="button"
      onClick={togglePlayer}
      className="fixed inset-x-0 bottom-14 z-[55] flex items-center gap-3 border-t border-white/10 bg-[#11131d] px-3 py-2 md:hidden"
    >
      <div className="relative h-10 w-10 overflow-hidden rounded">
        <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" sizes="40px" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-semibold">{currentTrack.title}</div>
        <div className="truncate text-xs text-white/60">{currentTrack.artist}</div>
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          }
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </span>
    </button>
  );
}
