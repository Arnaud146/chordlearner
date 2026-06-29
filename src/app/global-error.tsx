"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <html lang="en">
      <body className="bg-[#f8f4ea] text-zinc-900">
        <main className="mx-auto max-w-2xl space-y-4 px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">System error</p>
          <h1 className="text-3xl font-bold">The app is temporarily unavailable</h1>
          <p className="text-zinc-700">
            Please reload the page. If the problem persists, try again in a few moments.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 hover:bg-zinc-800"
            >
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
