# Architecture MVP

## Vue d'ensemble

L'application suit une architecture en couches :

1. **UI (`src/app`, `src/components`)**
   - Pages Next.js App Router
   - Composants React client/server
   - Pas de logique métier lourde
2. **API (`src/app/api`)**
   - Route handlers courts
   - Validation Zod des payloads
   - Orchestration vers services/repositories
3. **Services (`src/lib/services`)**
   - Workflows métier (parse manuel, transpose, finalize OCR, sélection voicings)
   - Composition de domaines + repositories
4. **Domain (`src/lib/domain`)**
   - Logique pure testable (chords, voicings, transposition, OCR post-process)
5. **Data (`src/lib/db/repositories`)**
   - Accès Supabase DB/Storage
   - Fonctions CRUD orientées tables

## Flux principaux

### 1) Saisie manuelle

`/songs/new` -> `POST /api/songs` -> `POST /api/songs/[songId]/parse-manual`

- Parser/normaliser les accords
- Persister `songs.raw_text`, `songs.normalized_text`
- Persister `chord_occurrences` et `unique_chords`

### 2) Vue morceau + voicings

`/songs/[songId]` charge:

- occurrences / accords uniques
- voicings RH à la demande par `key_context`
- sélection utilisateur persistée (`default_auto` ou `user_selected`)

### 3) Transposition

`POST /api/songs/[songId]/transpose`

- Met à jour `songs.current_key` et `notation_preference`
- La grille/chips sont recalculés côté vue via domaine transposition
- Les sélections de voicings restent isolées par tonalité (`key_context`)

### 4) OCR assisté (optionnel)

`upload` -> `detect` -> `finalize`

- `upload`: Storage + entrée `ocr_imports`
- `detect`: OCR.space backend + post-process + suggestions
- `finalize`: crée une Song puis réutilise le parse manuel

## Principes qualité

- TypeScript strict
- Validation Zod sur les entrées API
- Gestion d'erreur uniforme (`apiError`, `apiValidationError`)
- Domain/tests unitaires indépendants de l'UI et de la DB
- Fallback manuel toujours disponible
