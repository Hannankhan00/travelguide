"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // refetchOnWindowFocus causes a /api/auth/session hit every time the user
  // switches browser tabs — the single biggest driver of concurrent requests
  // on shared hosting. JWT sessions don't need live refreshes; the token
  // carries its own expiry and is validated on every protected route.
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
