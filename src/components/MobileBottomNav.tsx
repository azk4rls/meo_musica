"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Library } from "lucide-react";

import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Explore", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[56] flex h-14 items-center justify-around border-t border-white/10 bg-[#07070b] md:hidden">
      {links.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("flex flex-col items-center text-[11px]", active ? "text-white" : "text-white/60")}
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
