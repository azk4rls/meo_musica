"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Library, Search } from "lucide-react";

import { cn } from "@/lib/cn";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/search" },
  { label: "Library", icon: Library, href: "/library" },
  { label: "Liked Songs", icon: Heart, href: "/library?tab=liked" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-40 h-[calc(100vh-144px)]",
        "hidden w-[88px] border-r border-white/5 bg-[#07070b] px-3 py-5 md:block xl:w-[240px]",
      )}
    >
      <div className="flex h-full flex-col gap-2">
        <div className="mb-3 hidden rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 p-3 xl:block">
          <div className="text-sm font-black tracking-wide">Meo Music</div>
          <div className="text-xs text-white/60">Play your music now (FREE)</div>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.startsWith("/library") && pathname.startsWith("/library"));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-left",
                "transition-colors",
                isActive
                  ? "bg-violet-500/20 text-white"
                  : "text-[#b3b3b3] hover:bg-white/10 hover:text-white",
              )}
              aria-label={item.label}
            >
              <Icon size={22} />
              <span className="hidden text-sm font-semibold xl:inline">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-0 right-0 hidden px-4 xl:block">
        <div className="mb-2 text-xs font-semibold text-white/50">THEME</div>
        <div className="flex flex-wrap gap-2">
          {[
            { main: "#7c3aed", light: "#8b5cf6", dark: "#4c1d95" }, // Default Violet
            { main: "#06b6d4", light: "#22d3ee", dark: "#0891b2" }, // Cyan
            { main: "#ec4899", light: "#f472b6", dark: "#db2777" }, // Pink
            { main: "#10b981", light: "#34d399", dark: "#059669" }, // Emerald
            { main: "#f59e0b", light: "#fbbf24", dark: "#d97706" }, // Amber
            { main: "#ef4444", light: "#f87171", dark: "#dc2626" }, // Red
          ].map((theme, i) => (
            <button
              key={i}
              type="button"
              className="h-6 w-6 rounded-full border-2 border-transparent transition-transform hover:scale-110 hover:border-white/50"
              style={{ backgroundColor: theme.main }}
              onClick={() => {
                document.documentElement.style.setProperty("--theme-color", theme.main);
                document.documentElement.style.setProperty("--theme-color-light", theme.light);
                document.documentElement.style.setProperty("--theme-color-dark", theme.dark);
                localStorage.setItem("mowchi-theme", JSON.stringify(theme));
              }}
              aria-label={`Set theme color ${i}`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
