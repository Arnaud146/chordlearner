"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl space-y-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Application error</p>
      <h1 className="text-3xl font-bold text-zinc-900">Something went wrong</h1>
      <p className="text-zinc-700">
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 hover:bg-zinc-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
