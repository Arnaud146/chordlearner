# Prompt Stitch — Redesign ChordLearner

Copiez le prompt ci-dessous et donnez-le à Stitch avec les captures d’écran importées. Ajustez la section « Style cible » selon vos préférences.

---

## Prompt à copier

```
Tu travailles sur ChordLearner, une application web pour apprendre des morceaux au piano à partir de grilles d'accords. L'app cible des pianistes amateurs ou intermédiaires.

**Objectif :** Applique un nouveau design cohérent à tous les écrans fournis, en conservant la structure informationnelle et les contenus existants.

**Structure à préserver :**
- Landing : hero + CTA + section fonctionnalités (6 cartes) + « Comment ça marche » (3 étapes) + CTA final + footer (Mentions légales, CGU, Confidentialité)
- Auth (login/signup) : formulaire centré dans une carte, lien vers l'autre page
- Navbar : logo ChordLearner, liens Morceaux / Nouveau / Profil, Connexion ou email + Déconnexion
- Bibliothèque : titre, bouton + Nouveau morceau, barre de recherche, filtre tonalité, grille de cartes morceau (titre, artiste, tonalité)
- Nouveau morceau : Import (URL vs OCR) + saisie manuelle + encadré Conseils
- Détail morceau / Accords : en-tête (titre, artiste, tonalité), KeySelector, grille d'accords, liste d'accords uniques, panneau accord sélectionné (clavier visuel, inversions, voicings, doigtés)
- Profil : infos compte, stats (4 blocs), section sécurité
- Footer : tous les écrans publics doivent avoir le footer avec les liens légaux

**Langue :** Tous les libellés restent en français.

**Contraintes techniques :**
- Design réalisable avec Tailwind CSS, shadcn/ui (Button, Card, Input, Badge, Tabs, Select, etc.)
- Responsive : breakpoints pour mobile, tablette, desktop
- Accessibilité : contrastes suffisants, cibles tactiles >= 44px

**Style cible :**
[À PERSONNALISER — exemples ci-dessous]

Option A — Minimaliste épuré :
- Palette claire : fond blanc ou gris très clair (#fafafa), texte #1a1a1a, accent sobre (bleu ou vert discret)
- Typo : Inter ou system-ui, titres en font-weight 600
- Coins légèrement arrondis (rounded-lg), ombres légères
- Beaucoup de vide, hiérarchie nette

Option B — Dark mode premium :
- Fond sombre (#0f0f0f à #1a1a1a), texte clair, accent doré ou cyan
- Typo : Geist ou Outfit
- Cards avec bordures fines, effet glass/glassmorphism sur la navbar
- Ambiance « app pro » pour musiciens

Option C — Chaleureux et créatif :
- Palette inspirée du piano : ivoire (#f8f4ea), touches noires (#2d2a24), accent bordeaux ou terre de Sienne
- Typo : serif pour titres (Cormorant), sans pour corps (Manrope) — proche de l'actuel mais rafraîchi
- Motif ou texture légère en fond, cartes avec ombre douce
- Ton accueillant et « musical »

**Sortie attendue :** Des maquettes (screenshots/HTML selon Stitch) pour chaque écran, cohérentes entre elles, avec le système de design appliqué de façon uniforme.
```

---

## Utilisation rapide

1. **Importer les captures** dans un projet Stitch (IMAGE_TO_UI ou équivalent).
2. **Choisir une option** (A, B ou C) ou écrire votre propre description dans « Style cible ».
3. **Donner le prompt** à Stitch (avec `edit_screens` ou via l’interface).
4. **Itérer** : « Assombris un peu l’accent », « Rends les cartes plus compactes », etc.

---

## Variantes de prompt courts (pour des édits ciblés)

- *« Applique un thème dark mode à tous les écrans : fond #0f0f0f, texte #e5e5e5, accent cyan #22d3ee. Garde la structure et les textes. »*
- *« Passe tout en mode minimaliste : fond blanc, peu d’ombres, typo Inter, accent bleu #2563eb. »*
- *« Refais la landing en style glassmorphism : navbar et cartes semi-transparentes, blur, fond sombre avec gradient. »*
