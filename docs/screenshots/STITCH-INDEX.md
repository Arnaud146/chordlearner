# Index des captures ChordLearner pour Stitch

Toutes les captures sont dans `docs/screenshots/`. Utilisez ce fichier pour importer les écrans dans Stitch (projet IMAGE_TO_UI) et modifier le design.

## Capturer les écrans protégés

Pour 04–08 et 12, créez d’abord une session authentifiée :

```powershell
npx playwright codegen --save-storage=playwright/.auth/user.json http://localhost:3001/login
# Connectez-vous, puis fermez la fenêtre

$env:CHORDLEARNER_BASE_URL = "http://localhost:3001"
$env:CHORDLEARNER_STORAGE_STATE = "playwright\.auth\user.json"
$env:CHORDLEARNER_SONG_ID = "votre-uuid-morceau"  # ex. 29517776-6aca-4e14-8288-9db786d488b2
npm run screenshots
```

## Pages publiques (sans connexion)

| Fichier | Route | Description |
|---------|-------|-------------|
| `01-landing.png` | `/` | Page d'accueil, hero, fonctionnalités, CTA |
| `02-login.png` | `/login` | Formulaire de connexion |
| `03-signup.png` | `/signup` | Formulaire d'inscription |
| `09-cgu.png` | `/cgu` | Conditions générales d'utilisation |
| `10-confidentialite.png` | `/confidentialite` | Politique de confidentialité |
| `11-mentions-legales.png` | `/mentions-legales` | Mentions légales |

## Pages protégées (connecté)

| Fichier | Route | Description |
|---------|-------|-------------|
| `04-songs-library.png` | `/songs` | Bibliothèque des morceaux |
| `05-new-song.png` | `/songs/new` | Nouveau morceau (import URL/OCR/saisie) |
| `06-ocr-review.png` | `/songs/new/ocr-review?...` | Revue OCR / extraction web |
| `07-song-detail.png` | `/songs/[songId]` | Détail morceau (overview) |
| `07b-song-chords.png` | `/songs/[songId]/chords` | Morceau — onglet accords + clavier |
| `08-profil.png` | `/profil` | Profil utilisateur, stats, sécurité |
| `12-status.png` | `/status` | Page technique / diagnostic |

## Ordre recommandé pour Stitch

1. **Écrans clés** : 01, 02, 03, 04, 05, 07b, 08
2. **Écrans secondaires** : 06, 07, 09, 10, 11, 12

## Workflow Stitch

1. Créer un projet Stitch de type **IMAGE_TO_UI** (ou utiliser l’interface Stitch pour importer des images).
2. Importer les captures une par une comme références visuelles.
3. Utiliser `edit_screens` avec des prompts pour adapter le design.
4. Consulter [`design-brief-for-ai.md`](../design-brief-for-ai.md) pour les specs de design.
