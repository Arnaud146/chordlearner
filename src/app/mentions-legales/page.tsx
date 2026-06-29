import type { Metadata } from "next";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Legal Notice | ChordLearner",
  description: "Legal notice for the ChordLearner site.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <article className="prose prose-zinc mx-auto max-w-3xl flex-1 py-10 prose-headings:text-[var(--song-text)] prose-p:text-[var(--song-text-muted)]">
        <h1>Legal Notice</h1>
      <p>
        Site publisher: ChordLearner.
        <br />
        Contact: contact@chordlearner.app
      </p>
      <p>
        Hosting: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States.
      </p>
      <p>
        This content is provided for informational purposes. Complete and adapt this information with your
        legal details (company name, address, registration number, publication director).
      </p>
      </article>
      <PublicFooter />
    </div>
  );
}
