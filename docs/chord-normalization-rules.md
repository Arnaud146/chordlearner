# Chord Normalization Rules (MVP)

## Scope

This parser handles the MVP chord set used in the app domain layer (`src/lib/domain/chords`):

- Triads / simple chords: `C`, `G`, `Am`, `F`
- Extensions / variants: `Dm7`, `C7`, `Cmaj7`, `CM7`, `CΔ7`
- Suspended / added notes: `sus2`, `sus4`, `add9`
- Sixth chords: `6`, `m6`
- Altered qualities: `dim`, `aug`
- Slash chords: `C/E`, `D/F#`

## Input normalization

Before parsing:

- `♯` is converted to `#`
- `♭` is converted to `b`
- surrounding whitespace is trimmed

## Canonical representation

Each parsed chord returns:

- `rootNote` (e.g. `C`, `F#`, `Db`)
- `qualityCanonical` (e.g. `major`, `minor7`, `major7`, `sus4`)
- `slashBass` (optional, e.g. `E` in `C/E`)
- `normalizedChordSymbol` (canonical string form)
- `isSupported`

### Major 7 variants

- `Cmaj7`, `CM7`, `CΔ7` normalize to `Cmaj7`.

## Notation preference

`notationPreference` is supported in rendering:

- `auto`: keep parsed accidental form
- `sharps`: convert flats to sharps where enharmonic map exists (`Db` -> `C#`)
- `flats`: convert sharps to flats where enharmonic map exists (`F#` -> `Gb`)

## Unsupported chords

If parsing fails or quality is unknown:

- parser returns `isSupported = false`
- parser keeps the sanitized raw symbol in `normalizedChordSymbol`
- parser sets a `parseErrorCode` (`INVALID_ROOT`, `UNSUPPORTED_QUALITY`, etc.)

This ensures the flow never breaks and unsupported tokens remain auditable.
