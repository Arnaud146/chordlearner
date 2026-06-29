# API Contracts (MVP)

Toutes les réponses utilisent un format JSON:

- Succès: `{ "data": ... }`
- Erreur: `{ "error": "message" }`

## Songs

- `GET /api/songs`
- `POST /api/songs`
  - body: `{ title, artist?, originalKey?, sourceType, notationPreference }`

- `GET /api/songs/[songId]`
- `PATCH /api/songs/[songId]`
- `DELETE /api/songs/[songId]`

- `POST /api/songs/[songId]/parse-manual`
  - body: `{ rawText, originalKey?, notationPreference }`
  - return: `{ occurrenceCount, uniqueChordCount, unknownChords[] }`

- `POST /api/songs/[songId]/transpose`
  - body: `{ toKey, notationPreference }`
  - return: `{ song, fromKey, toKey, notationPreference, semitoneDelta }`

## Voicings

- `GET /api/songs/[songId]/voicings?chord=...&keyContext=...&handMode=RH|BH`
  - génère et persiste les options si absentes
  - return: `{ options, defaultVoicingOptionId }`

- `GET /api/songs/[songId]/voicings/selection?chord=...&keyContext=...&handMode=RH|BH`
  - return: `{ selection, defaultVoicingOptionId }`
  - crée `default_auto` si aucune sélection

- `POST /api/songs/[songId]/voicings/selection`
  - body: `{ chord, keyContext, handMode, selectedVoicingOptionId }`
  - persiste `selection_source = user_selected`

## OCR (assisté)

- `POST /api/ocr/upload`
  - form-data: `file`, `songId?`
  - return: `{ ocrImportId, imageUrl, reviewStatus }`

- `POST /api/ocr/detect`
  - body: `{ imageUrl, ocrImportId?, songId? }`
  - return: `{ ocrImportId, imageUrl, rawText, lines, tokens }`

- `POST /api/ocr/finalize`
  - body: `{ title, artist?, originalKey?, notationPreference, validatedText, ocrImportId?, reviewStatus }`
  - return: `{ songId, occurrenceCount, uniqueChordCount, unknownChords }`

## Status codes

- `200`: succès
- `201`: ressource créée (`POST /api/songs`)
- `400`: validation invalide (Zod)
- `404`: ressource introuvable
- `500`: erreur serveur inattendue
- `501`: endpoint non implémenté (fallback OCR si provider indisponible)
