import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppToaster } from "@/components/providers/toaster";
import { auth } from "@/lib/auth";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
        >
          <SessionProvider session={session}>
            {children}
            <AppToaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
