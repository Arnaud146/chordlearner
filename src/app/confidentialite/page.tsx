import type { Metadata } from "next";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | ChordLearner",
  description: "ChordLearner privacy policy.",
};

export default function ConfidentialitePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <article className="prose prose-zinc mx-auto max-w-3xl flex-1 py-10 prose-headings:text-[var(--song-text)] prose-p:text-[var(--song-text-muted)]">
      <h1>Privacy Policy</h1>
      <h2>Data collected</h2>
      <p>
        ChordLearner collects the data needed to run your account (email, preferences, songs).
      </p>
      <h2>Purposes</h2>
      <p>
        The data is processed to provide the service, secure the application and improve the
        user experience.
      </p>
      <h2>Retention</h2>
      <p>The data is kept only for as long as strictly necessary for the purpose of the service.</p>
      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your data via
        contact@chordlearner.app.
      </p>
      <p>
        This content is a minimal template and must be adapted to your actual GDPR obligations before
        final publication.
      </p>
      </article>
      <PublicFooter />
    </div>
  );
}
