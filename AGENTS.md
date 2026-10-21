# Vyva — agent guide

pnpm monorepo for Vyva, a viewer and editor for two kinds of content: documents (Word-style pages)
and decks (Canva-style slides). One renderer turns content into HTML, so what the editor shows is
what thumbnails, the viewer and every export show.

This file is a router, not a manual. Read the file that matches your task before writing code.

| If you are going to… | Read |
|---|---|
| Know the quality bar — what not to write, comments included | [.agents/anti-slop.md](.agents/anti-slop.md) |

## Things that will otherwise burn an hour

- **Vitest runs inside the package.** Run it from the package folder (or with
  `pnpm --filter <name> test`), never from the repo root.
