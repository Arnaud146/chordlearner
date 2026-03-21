import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Erreur 404</p>
      <h1 className="text-3xl font-bold text-zinc-900">Cette page n&apos;existe pas</h1>
      <p className="text-zinc-700">
        Le lien est peut-etre incorrect, ou la ressource a ete deplacee.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Link
          href="/"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 hover:bg-zinc-800"
        >
          Retour a l&apos;accueil
        </Link>
        <Link
          href="/songs"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
        >
          Voir mes morceaux
        </Link>
      </div>
    </section>
  );
}
