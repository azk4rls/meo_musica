"use client";

import React from "react";
import Link from "next/link";
import { Home, Search, Library, User, Menu } from "lucide-react";

import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/search", label: "Mencari", icon: Search },
  { href: "/library", label: "Pustaka", icon: Library },
  { href: "/developer", label: "Developer", icon: User },
];

export function MobileQuickSidebar() {
  return null;
}
