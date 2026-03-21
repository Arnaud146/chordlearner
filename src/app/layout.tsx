import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNavbar } from "@/components/app-navbar";
import { createClient } from "@/lib/supabase/server";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ChordLearner",
    template: "%s | ChordLearner",
  },
  description: "Apprends le piano a partir de tes grilles d'accords.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ChordLearner",
    description: "Apprends le piano a partir de tes grilles d'accords.",
    type: "website",
    url: "/",
    locale: "fr_FR",
    siteName: "ChordLearner",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChordLearner",
    description: "Apprends le piano a partir de tes grilles d'accords.",
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
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#f8f4ea]`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-50"
        >
          Aller au contenu principal
        </a>
        <AppNavbar userEmail={userEmail} />
        <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
