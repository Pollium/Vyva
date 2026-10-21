# @vyva/core

The Vyva content model, and the one renderer that turns it into HTML. It has no dependency on React
or Node, so the same code renders in the browser, on a server and inside an export.

```sh
npm install @vyva/core
```

## The content

```ts
import type { Content, DocumentContent, DeckContent } from '@vyva/core/content';
```

- A **document** is a page design and a list of blocks, each one an HTML fragment with an id:
  headings, paragraphs, lists, checklists, tables, code, images, equations and page breaks.
- A **deck** has a format (`16:9`, `4:3`, `1:1`, `a4-portrait` or `a4-landscape`), a theme and
  slides. Each slide holds positioned elements: text, images, shapes, tables and code.
- An image is referenced by its file id, a UUID the host gives it. The content never holds a URL.

The interfaces carry [typia](https://typia.io) tags, so a host with typia can validate content
from a client with `typia.assert<Content>(body)`.

## Rendering

```ts
import { renderDocument, renderSlide, CONTENT_CSS } from '@vyva/core/render';

const html = renderDocument(content, (fileId) => `/files/${fileId}`);
```

`fileUrl` turns a file id into the URL the HTML loads. Return `null` to leave the image out.
`CONTENT_CSS` styles the result. Every class name starts with `vy-`.

## Building content

| Module | What it does |
|---|---|
| `@vyva/core/markdown-blocks` | `markdownToBlocks` turns Markdown into document blocks. `![alt](asset:<fileId>)` becomes an image |
| `@vyva/core/slide-layouts` | `layoutSlide` builds a slide from a spec, such as a title, bullets, two columns, an image, a table or a quote |
| `@vyva/core/slide-relayout` | `relayoutSlide` moves an existing slide into another layout |
| `@vyva/core/deck-theme` | `retheme` and `reformat` change a deck's theme or format and adjust every slide |
| `@vyva/core/themes` | The default deck theme and document design |
| `@vyva/core/code` | Syntax highlighting for code elements, and code sizing |
| `@vyva/core/math` | LaTeX between `$…$` and `$$…$$` rendered as MathML |
