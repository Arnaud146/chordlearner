import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialite | ChordLearner",
  description: "Politique de confidentialite de ChordLearner.",
};

export default function ConfidentialitePage() {
  return (
    <article className="prose prose-zinc mx-auto max-w-3xl py-10">
      <h1>Politique de confidentialite</h1>
      <h2>Donnees collectees</h2>
      <p>
        ChordLearner collecte les donnees necessaires au fonctionnement du compte (email, preferences, morceaux).
      </p>
      <h2>Finalites</h2>
      <p>
        Les donnees sont traitees pour fournir le service, securiser l&apos;application et ameliorer
        l&apos;experience utilisateur.
      </p>
      <h2>Conservation</h2>
      <p>Les donnees sont conservees pendant la duree strictement necessaire a la finalite du service.</p>
      <h2>Droits</h2>
      <p>
        Tu peux demander l&apos;acces, la rectification ou la suppression de tes donnees via
        contact@chordlearner.app.
      </p>
      <p>
        Ce contenu est un modele minimal et doit etre adapte a tes obligations RGPD reelles avant
        publication definitive.
      </p>
    </article>
  );
}
