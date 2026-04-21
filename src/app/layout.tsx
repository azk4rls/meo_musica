import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { FullPlayer } from "@/components/FullPlayer";
import { MiniPlayer } from "@/components/MiniPlayer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileQuickSidebar } from "@/components/MobileQuickSidebar";
import { PlayerBar } from "@/components/PlayerBar";
import { Sidebar } from "@/components/Sidebar";
import { TopNavbar } from "@/components/TopNavbar";
import { YouTubePlayerEngine } from "@/components/YouTubePlayerEngine";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meo Music",
  description: "Production-grade Meocom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="h-screen overflow-hidden bg-[#07070b] text-white">
        <AppProviders>
          <TopNavbar />
          <Sidebar />
          <MobileQuickSidebar />
          <main className="mt-14 h-[calc(100vh-56px)] overflow-y-auto bg-[#07070b] pb-24 md:ml-[88px] md:pb-24 xl:ml-[240px]">
            {children}
          </main>
          <YouTubePlayerEngine />
          <FullPlayer />
          <MiniPlayer />
          <MobileBottomNav />
          <PlayerBar />
        </AppProviders>
      </body>
    </html>
  );
}
