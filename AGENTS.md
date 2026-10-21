# Vyva — agent guide

pnpm monorepo for Vyva, a viewer and editor for two kinds of content: documents (Word-style pages)
and decks (Canva-style slides). One renderer turns content into HTML, so what the editor shows is
what thumbnails, the viewer and every export show.

| Package | What it is |
|---|---|
| `packages/core` (`@vyva/core`) | The content model and the renderer; no React, no Node |
| `packages/react` (`@vyva/react`) | The viewer, the document editor and the deck editor |
| `packages/convert` (`@vyva/convert`) | Node only: cleaning, import and export of files |
| `packages/ai` (`@vyva/ai`) | The model's view of content and the edits it applies |
| `apps/playground` | The editors against an in-memory session, for trying changes in a browser |

This file is a router, not a manual. Read the file that matches your task before writing code.

| If you are going to… | Read |
|---|---|
| Know the quality bar — what not to write, comments included | [.agents/anti-slop.md](.agents/anti-slop.md) |
| Change what a package offers a host | That package's `README.md`, and keep it true |

## Things that will otherwise burn an hour

- **Vitest runs inside the package.** Run it from the package folder (or with
  `pnpm --filter <name> test`), never from the repo root.
- **Every Tailwind class in `@vyva/react` carries the `vy:` prefix.** `styles.css` builds Tailwind
  with `prefix(vy)` so the host's own classes never collide, and its theme variables come out as
  `--vy-color-*`. A class without the prefix compiles to nothing and fails silently.
- **Inside the workspace a package resolves to the other packages' sources.** `exports` points at
  `src` and only `publishConfig` points at `dist`, so typecheck and tests need no build, and the
  playground processes `@vyva/react/styles.css` with its own Tailwind.
- **pnpm refuses versions published less than 14 days ago.** `pnpm add` fails with
  `ERR_PNPM_NO_MATURE_MATCHING_VERSION` for a release that is only days old. Pin the newest version
  that is old enough; do not add a release-age exclusion to `pnpm-workspace.yaml`.
- **`@vyva/ai` typechecks with the DOM library.** Turndown's types describe its nodes as
  `HTMLElement`, which only the `DOM` lib defines, even though it runs in Node too.
- **A real PDF needs Gotenberg.** The tests fake it. To look at an actual PDF, run
  `docker run --rm -d -p 3990:3000 gotenberg/gotenberg:8` and export through
  `gotenberg({ url: 'http://127.0.0.1:3990' })`; `pdftoppm` turns the pages into images.
