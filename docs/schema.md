# Schema de la base de données — ChordLearner MVP

## Tables

| Table                       | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| `songs`                     | Morceaux importés ou créés manuellement               |
| `chord_occurrences`         | Chaque occurrence d'accord dans la grille (ordonnée)  |
| `unique_chords`             | Accords distincts par morceau avec infos de parsing   |
| `chord_voicing_options`     | Voicings piano générés pour chaque accord/tonalité    |
| `user_voicing_selections`   | Choix de voicing de l'utilisateur par accord/tonalité |
| `ocr_imports`               | Imports OCR (squelette, pas encore actif)              |

## Relations principales

```
songs ──< chord_occurrences      (1:N, cascade delete)
songs ──< unique_chords           (1:N, cascade delete)
songs ──< chord_voicing_options   (1:N, cascade delete)
songs ──< user_voicing_selections (1:N, cascade delete)
songs ──< ocr_imports             (1:N, set null on delete)

chord_voicing_options ──< user_voicing_selections
  (selected_voicing_option_id → chord_voicing_options.id, cascade delete)
```

## Contraintes d'unicité importantes

| Table                     | Colonnes                                                              | Raison                                                         |
| ------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `chord_occurrences`       | `(song_id, line_index, token_index)`                                  | Garantit l'ordre unique de chaque accord dans la grille        |
| `unique_chords`           | `(song_id, normalized_chord_symbol)`                                  | Un seul enregistrement par accord distinct par morceau         |
| `chord_voicing_options`   | `(song_id, key_context, normalized_chord_symbol, hand_mode, inversion_index)` | Un voicing unique par combinaison accord/tonalité/main/renversement |
| `user_voicing_selections` | `(song_id, key_context, normalized_chord_symbol, hand_mode)`          | Un seul choix actif par accord/tonalité/main                   |

## Pourquoi `key_context` ?

Les voicings et les sélections utilisateur sont **contextualisés par tonalité**. Quand l'utilisateur transpose un morceau (ex: C → Eb), les accords changent et les voicings doivent être recalculés. `key_context` permet de stocker des voicings pré-calculés pour chaque tonalité sans écraser ceux des autres.

## Pourquoi `raw` / `corrected` / `normalized` pour les accords ?

Trois niveaux de représentation d'un symbole d'accord :

1. **`chord_symbol_raw`** — Texte brut tel qu'extrait (OCR ou saisie). Peut contenir des erreurs : `Cmaj7`, `C maj 7`, `Cma7`.
2. **`chord_symbol_corrected`** — Après correction manuelle de l'utilisateur (si `is_user_corrected = true`). Piste d'audit.
3. **`normalized_chord_symbol`** — Forme canonique utilisée partout dans l'app : `Cmaj7`. C'est la clé de jointure avec `unique_chords` et `chord_voicing_options`.

Cette séparation permet de :
- Garder une trace de l'OCR original pour debug/amélioration
- Permettre la correction utilisateur sans perdre le brut
- Utiliser une forme normalisée fiable pour la logique métier (voicings, transposition)
