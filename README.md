# Vyva

A viewer and an editor for two kinds of content: **documents**, pages like a Word file, and
**decks**, slides like a Canva presentation. One renderer turns content into HTML, so the editor,
the viewer, the thumbnails and every export show the same thing.

| Package | What it is |
|---|---|
| [`@pollium/vyva-core`](packages/core) | The content model and the renderer. Runs anywhere and depends on neither React nor Node |
| [`@pollium/vyva-react`](packages/react) | The viewer, the document editor and the deck editor |
| [`@pollium/vyva-convert`](packages/convert) | Server side. Cleans what clients send, imports Word, PowerPoint, PDF, Markdown and text files, and exports to PDF, Word, PowerPoint and HTML |
| [`@pollium/vyva-ai`](packages/ai) | Shows an AI model the content as Markdown and applies the edits it asks for |

[`apps/playground`](apps/playground) runs the viewer and both editors against an in-memory session.

## How a host plugs in

Vyva stores nothing and fetches nothing. The host owns the content and the files and hands Vyva
small functions:

- **A session.** `useVyvaSession({ initial, save, load })` keeps the content and saves it through
  the host's `save` a moment after each edit. A save that conflicts with someone else's edit can
  be resolved by reloading or by keeping your own.
- **`fileUrl(fileId)`**, so the editors and the viewer can show an image.
- **`readImage(fileId)` and `saveImage(image)`** on the server, so `@pollium/vyva-convert` can export and
  import files with their images.
- **A PDF engine**, a function that prints HTML to PDF. `gotenberg({ url })` is one for a
  [Gotenberg](https://gotenberg.dev) server.

Content is plain JSON: a `Content` from `@pollium/vyva-core/content` is either a `DocumentContent`, a list
of HTML blocks with a page design, or a `DeckContent`, a list of slides with positioned elements
and a theme. Images are referenced by the UUID of the host's file.

## Working on Vyva

Node 24 and pnpm 10.

```sh
pnpm install
pnpm --filter playground dev
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

`pnpm release` builds every package and publishes the ones whose version is not on npm yet. It needs
`npm login` with access to the pollium organization.

## License

Not decided yet. No license is granted until one is chosen.
