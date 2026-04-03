# AutoPot Athena — Projektregeln

## Verhaltensregeln

- Mach was gefragt wird, nicht mehr
- NIE Dateien erstellen die nicht nötig sind
- IMMER bestehende Dateien editieren statt neue zu erstellen
- NIE Doku/README erstellen ohne Aufforderung
- NIE ins Root speichern — App-Code gehört in `src/app/`
- IMMER Datei lesen vor dem Editieren
- NIE Secrets/Credentials committen
- Sprache: Deutsch, kurz und knapp

## App Tech-Stack

- SvelteKit 2 + Svelte 5 (Legacy-Mode: `runes: false` — `$:` und `$store` Syntax)
- Tailwind CSS 3, TypeScript, adapter-static
- PWA mit manifest.json + Service Worker
- Build: `cd src/app && npm run build`
- Dev: `cd src/app && npm run dev`

## Build & Test

```bash
cd src/app && npm run build
cd src/app && npm test
```

- IMMER nach Änderungen Build prüfen

## Parallelisierung

- Alle unabhängigen Operationen parallel in EINER Message
- Alle File-Reads/Writes/Edits gebündelt
- Agents nur spawnen wenn Task komplex genug ist

## Vercel Deploy

- Static Site (adapter-static), `vercel.json` vorhanden
- Secrets in Vercel Env Variables, nie in Git
- Stateless Functions, kein KV/Postgres (discontinued)
