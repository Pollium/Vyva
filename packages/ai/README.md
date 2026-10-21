# @vyva/ai

Lets an AI model work on Vyva content. It gives the model a view of a document or a deck it can
read, and applies the edits the model answers with. It calls no model itself: the host's agent
does that, and uses this package for its tools.

```sh
npm install @vyva/ai
```

## Documents

```ts
import { applyDocumentOperations, documentForModel } from '@vyva/ai/document-edits';

const view = documentForModel(content, 40_000);
const edited = applyDocumentOperations(content, [
    { op: 'replace', blockId: 'b3', markdown: '## Goals\n\n- Split a /24 network' },
    { op: 'insert_after', blockId: null, markdown: '**Draft**' },
    { op: 'delete', blockId: 'b7' },
    { op: 'append', markdown: 'The end' }
]);
```

`documentForModel` lists the blocks, each with its id and its text in Markdown, until `maxChars` is
reached, and tells the model when blocks were left out.

- Images appear as `![alt](asset:<fileId>)`.
- Page breaks appear as `PAGE_BREAK_MARKER` (`[page break]`, from `@vyva/ai/html-markdown`).
- Equations stay as the LaTeX the model wrote.

The model can write all of these back. `insert_after` with a `null` block id inserts at the start.

## Decks

```ts
import { applyDeckOperations, deckForModel } from '@vyva/ai/deck-edits';

const view = deckForModel(content);
const edited = applyDeckOperations(content, [
    { op: 'add_slide', afterSlideId: null, slide: { layout: 'bullets', title: 'Classes', bullets: ['A', 'B'] } },
    { op: 'set_text', slideId: 's1', elementId: 'e2', markdown: '- One\n- **Two**' }
]);
```

`deckForModel` lists every slide with its elements, their text as Markdown and their boxes.

| Operation | What it does |
|---|---|
| `add_slide` | Builds a slide from a layout spec. A `null` `afterSlideId` adds it at the end |
| `insert_slide` | Inserts a slide that is already built |
| `replace_slide` | Rebuilds a slide from a layout spec and keeps its id |
| `move_slide` | Moves a slide. A `null` `afterSlideId` moves it to the start |
| `delete_slide` | Removes a slide |
| `set_text` | Writes Markdown into a text box, a code block or a shape that holds text. A lone code fence turns a text box into code |

## When an edit cannot be applied

An unknown id, or text sent to a shape that cannot hold it, throws `EditRefused` from
`@vyva/ai/errors`. Its message is written for the model, so hand it back as the tool's result and
the model can try again.
