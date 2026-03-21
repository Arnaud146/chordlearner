# Guide — Captures d’écran pour le brief de design

Ce guide complète [`design-brief-for-ai.md`](./design-brief-for-ai.md). Enregistrez les fichiers dans le dossier [`screenshots/`](./screenshots/).

## Prérequis

1. Variables d’environnement configurées (copie de `.env.example` → `.env.local`), notamment Supabase, pour que l’app démarre et que le middleware fonctionne.
2. Serveur de développement : `npm run dev` (par défaut `http://localhost:3000`).

## Résolution recommandée

- **1920×1080** ou **1440×900** pour le viewport du navigateur (fenêtre non maximisée bizarre).
- Capture **pleine page** pour la landing (longue) si votre outil le permet ; sinon : une capture du **hero** + une capture de la section **Fonctionnalités**.

## Liste des fichiers à produire

| Fichier | Route | Notes |
|---------|-------|--------|
| `01-landing.png` | `/` | **Déconnecté** (sinon redirection vers `/songs`). Navigation privée ou autre navigateur. |
| `02-login.png` | `/login` | Formulaire visible. |
| `03-signup.png` | `/signup` | Formulaire visible. |
| `04-songs-library.png` | `/songs` | Avec au moins une carte si possible ; sinon état vide. |
| `05-new-song.png` | `/songs/new` | Import + saisie manuelle + encadré Conseils. |
| `06-ocr-review.png` | `/songs/new/ocr-review?...` | Après upload : `ocrImportId` et `imageUrl` dans l’URL (depuis le flux Nouveau morceau). |
| `07-song-detail.png` | `/songs/[songId]` | Remplacez `[songId]` par un UUID réel de votre base. Grille + clavier + voicings. |
| `08-profil.png` | `/profil` | Compte, stats, sécurité. |

## Capture manuelle (Option A)

1. Ouvrez chaque URL dans Chrome / Edge / Firefox.
2. **Windows** : `Win + Shift + S` (recadrage) ou outil Capture d’écran ; **macOS** : `Cmd + Shift + 4`.
3. Pour **pleine page** : extension navigateur « full page screenshot » ou DevTools (mode device + capture).
4. Enregistrez sous les noms ci-dessus dans `docs/screenshots/`.

## Capture automatisée (Option B)

Avec le serveur `npm run dev` déjà lancé :

```bash
npm install
npx playwright install chromium
npm run screenshots
```

- Par défaut : capture **`01` à `03`** (pages publiques) vers `docs/screenshots/`.
- Pour les pages **protégées**, exportez un fichier d’état de session Playwright après connexion manuelle, puis :

```bash
set CHORDLEARNER_STORAGE_STATE=playwright\.auth\user.json
set CHORDLEARNER_SONG_ID=votre-uuid-morceau
npm run screenshots
```

(PowerShell : `$env:CHORDLEARNER_STORAGE_STATE="..."` ; bash : `export CHORDLEARNER_STORAGE_STATE=...`)

### Créer `playwright/.auth/user.json`

Depuis la racine du dépôt :

```bash
npx playwright codegen --save-storage=playwright/.auth/user.json http://localhost:3000/login
```

Connectez-vous dans la fenêtre du codegen, puis **fermez-la** : le fichier `user.json` est écrit (ignoré par git — voir `.gitignore`).

Avec `npm run dev` toujours actif :

**PowerShell**

```powershell
$env:CHORDLEARNER_STORAGE_STATE = "playwright\.auth\user.json"
$env:CHORDLEARNER_SONG_ID = "votre-uuid-morceau"
npm run screenshots
```

**bash**

```bash
export CHORDLEARNER_STORAGE_STATE=playwright/.auth/user.json
export CHORDLEARNER_SONG_ID=votre-uuid-morceau
npm run screenshots
```

Variables optionnelles : `CHORDLEARNER_OCR_REVIEW_QUERY`, `CHORDLEARNER_BASE_URL`, `CHORDLEARNER_SCREENSHOT_DIR` — voir [`scripts/capture-screenshots.mjs`](../scripts/capture-screenshots.mjs).

## Fichiers à ne pas versionner (optionnel)

Si les captures contiennent des données personnelles, ajoutez `docs/screenshots/*.png` à `.gitignore` ou ne commitez que des jeux de données factices.

## Checklist avant d’envoyer le package à une IA

- [ ] `design-brief-for-ai.md` lu ou joint
- [ ] Toutes les images nommées `01-` … `08-` (ou équivalent décrit dans le brief)
- [ ] Landing capturée **sans** session connectée
- [ ] Au moins une capture du **détail morceau** avec grille et clavier visibles
