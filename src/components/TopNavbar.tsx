"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell, Search } from "lucide-react";

import { cn } from "@/lib/cn";

const nav = [
  { href: "/", label: "Discover" },
  { href: "/search", label: "Browse" },
  { href: "/library", label: "Collection" },
];

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const canGoBack = pathname !== "/";
  const pageTitle =
    pathname === "/" ? "Beranda Meo" : pathname === "/search" ? "Mencari" : pathname === "/library" ? "Pustaka" : "Music";
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-white/10 bg-[#07070b]/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Kembali"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-cyan-400" />
          )}
          <span className="text-sm font-black tracking-wider">{pageTitle}</span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                pathname === item.href ? "bg-violet-500/25 text-white" : "text-white/65 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-white/70">
          <Link href="/search" className="rounded-full p-2 hover:bg-white/10">
            <Search size={16} />
          </Link>
          <button type="button" className="rounded-full p-2 hover:bg-white/10">
            <Bell size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
