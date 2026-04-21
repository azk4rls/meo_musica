"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  React.useEffect(() => {
    try {
      const t = localStorage.getItem("mowchi-theme");
      if (t) {
        const theme = JSON.parse(t);
        document.documentElement.style.setProperty("--theme-color", theme.main);
        document.documentElement.style.setProperty("--theme-color-light", theme.light);
        document.documentElement.style.setProperty("--theme-color-dark", theme.dark);
      }
    } catch (e) {}
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
