import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGU | ChordLearner",
  description: "Conditions generales d'utilisation de ChordLearner.",
};

export default function CguPage() {
  return (
    <article className="prose prose-zinc mx-auto max-w-3xl py-10">
      <h1>Conditions generales d&apos;utilisation (CGU)</h1>
      <h2>1. Objet</h2>
      <p>
        ChordLearner propose un service d&apos;apprentissage du piano base sur les grilles d&apos;accords.
      </p>
      <h2>2. Compte utilisateur</h2>
      <p>L&apos;utilisateur est responsable des informations fournies et de la confidentialite de son compte.</p>
      <h2>3. Propriete intellectuelle</h2>
      <p>
        Les contenus importes restent sous la responsabilite de l&apos;utilisateur, qui garantit disposer des
        droits necessaires.
      </p>
      <h2>4. Limitation de responsabilite</h2>
      <p>
        Le service est fourni &quot;en l&apos;etat&quot; sans garantie d&apos;absence d&apos;interruption ou d&apos;erreur.
      </p>
      <p>
        Ce modele doit etre adapte et valide juridiquement avant une exploitation commerciale.
      </p>
    </article>
  );
}
