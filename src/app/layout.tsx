import type { Metadata } from "next";
import { AppNavbar } from "@/components/app-navbar";
import { optionBBodyFont } from "@/components/option-b/theme";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ChordLearner",
    template: "%s | ChordLearner",
  },
  description: "Learn the piano from your chord charts.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ChordLearner",
    description: "Learn the piano from your chord charts.",
    type: "website",
    url: "/",
    locale: "en_US",
    siteName: "ChordLearner",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChordLearner",
    description: "Learn the piano from your chord charts.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
  } catch {
    userEmail = null;
  }

  return (
    <html lang="en">
      <body
        className={`${optionBBodyFont.variable} font-sans antialiased bg-[var(--song-bg)]`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-50"
        >
          Skip to main content
        </a>
        <AppNavbar userEmail={userEmail} />
        <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
