"use client";

import type { ComponentProps } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({
  children,
  ...props
}: ComponentProps<typeof NextAuthSessionProvider>) {
  return (
    <NextAuthSessionProvider {...props}>{children}</NextAuthSessionProvider>
  );
}
