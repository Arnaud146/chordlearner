# ChordLearner

Application web pour apprendre des morceaux au piano a partir de grilles d'accords.

## Stack technique

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (database + storage)
- Vitest pour les tests

## Demarrage rapide

```bash
# Installer les dependances
npm install

# Copier et remplir les variables d'environnement
cp .env.example .env.local
# Windows PowerShell: Copy-Item .env.example .env.local

# Lancer le serveur de developpement
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Variables d'environnement

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `OCR_SPACE_API_KEY` (optionnel, server only)
- `GOOGLE_CLOUD_VISION_API_KEY` (optionnel, server only)

## OCR providers

Dans l'ecran OCR, vous pouvez choisir le provider:

- `OCR.space`
- `Google Vision`

## Setup Supabase (minimum)

1. Creer un projet Supabase.
2. Executer la migration `supabase/migrations/001_init_mvp.sql`.
3. Creer un bucket public `ocr-imports`.
4. Renseigner `.env.local`.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Lint ESLint |
| `npm run test` | Tests unitaires/integration |
| `npm run test:watch` | Tests en mode watch |
| `npm run screenshots` | Captures Playwright pour le brief design (voir `docs/SCREENSHOTS-GUIDE.md`) |

## Documentation

- `docs/architecture.md`
- `docs/schema.md`
- `docs/chord-normalization-rules.md`
- `docs/api-contracts.md`
- `docs/design-brief-for-ai.md` — contexte produit + écrans (redesign / IA)
- `docs/SCREENSHOTS-GUIDE.md` — captures pour accompagner le brief
