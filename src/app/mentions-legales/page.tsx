import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions legales | ChordLearner",
  description: "Mentions legales du site ChordLearner.",
};

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-zinc mx-auto max-w-3xl py-10">
      <h1>Mentions legales</h1>
      <p>
        Editeur du site: ChordLearner.
        <br />
        Contact: contact@chordlearner.app
      </p>
      <p>
        Hebergement: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States.
      </p>
      <p>
        Ce contenu est fourni a titre informatif. Complete et adapte ces informations avec tes donnees
        legales (raison sociale, adresse, SIREN, directeur de publication).
      </p>
    </article>
  );
}
