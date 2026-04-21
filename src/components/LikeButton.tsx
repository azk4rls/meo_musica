"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/cn";

type LikeButtonProps = {
  liked: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

export function LikeButton({ liked, onClick, disabled }: LikeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
        liked ? "text-[#1DB954]" : "text-[#b3b3b3] hover:text-white",
        disabled && "opacity-40",
      )}
      aria-label={liked ? "Unlike song" : "Like song"}
    >
      <Heart size={18} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
