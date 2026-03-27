"use client";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{
        options: {
          // Matches `staticGET` in `app/api/search/route.ts` (Orama index baked into static export).
          type: "static",
          api: "/api/search",
        },
      }}
    >
      {children}
    </RootProvider>
  );
}
