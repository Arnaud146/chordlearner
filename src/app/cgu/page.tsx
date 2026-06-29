import type { Metadata } from "next";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Terms | ChordLearner",
  description: "ChordLearner terms of service.",
};

export default function CguPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <article className="prose prose-zinc mx-auto max-w-3xl flex-1 py-10 prose-headings:text-[var(--song-text)] prose-p:text-[var(--song-text-muted)]">
      <h1>Terms of Service</h1>
      <h2>1. Purpose</h2>
      <p>
        ChordLearner offers a piano learning service based on chord charts.
      </p>
      <h2>2. User account</h2>
      <p>The user is responsible for the information provided and for keeping their account confidential.</p>
      <h2>3. Intellectual property</h2>
      <p>
        Imported content remains the user&apos;s responsibility, and the user warrants that they hold the
        necessary rights.
      </p>
      <h2>4. Limitation of liability</h2>
      <p>
        The service is provided &quot;as is&quot; without any guarantee of being uninterrupted or error-free.
      </p>
      <p>
        This template must be reviewed and validated by a legal professional before any commercial use.
      </p>
      </article>
      <PublicFooter />
    </div>
  );
}
