# @pollium/vyva-convert

Server-side tools for Vyva content. It cleans what clients send, imports Word, PowerPoint, PDF,
Markdown and text files, and exports to PDF, Word, PowerPoint and HTML. It runs in Node.

```sh
npm install @pollium/vyva-convert
```

## Cleaning what clients send

```ts
import { cleanContent } from '@pollium/vyva-convert/clean-content';

const content = cleanContent(body.content);
```

The cleaner keeps the editor's formatting. It removes scripts, event handlers, unsafe links and any
image that does not point at a file id. Ids that repeat or are not valid get new ones. Each text box is
saved as tall as its text. For a single HTML fragment, use `cleanHtml` from
`@pollium/vyva-convert/clean-html`.

## Exporting

```ts
import { exportContent, isExportFormat } from '@pollium/vyva-convert/export';
import { gotenberg } from '@pollium/vyva-convert/gotenberg';
import { contentDisposition } from '@pollium/vyva-convert/attachment';

if(!isExportFormat(request.params.format)) return reply.code(400).send();

const file = await exportContent(content, request.params.format, {
    title: 'Subnetting guide',
    language: 'en',
    readImage: async (fileId) => {
        const stored = await files.find(fileId);
        return stored === null ? null : { data: stored.bytes, contentType: stored.contentType };
    },
    pdfEngine: gotenberg({ url: 'http://gotenberg:3000' })
});

reply.header('content-disposition', contentDisposition('Subnetting guide', file.extension)).type(file.contentType).send(file.data);
```

| Content | Formats |
|---|---|
| Document | `pdf`, `docx`, `html` |
| Deck | `pptx`, `pdf` |

- `readImage` is called once for every image the content uses. Return `null` and the export goes
  on without that image.
- The PDF fonts and images travel with the page, so the PDF engine needs no network access.
- `pdfEngine` is only needed for `pdf`. It is a function that takes a `PdfJob` (the HTML, the files
  it refers to by name, a footer with Chromium's `pageNumber` and `totalPages` classes, and the
  page size in inches) and returns the PDF. Use `gotenberg` or write your own with Puppeteer or
  Playwright.
- The `html` export is one self-contained file, with its images and fonts inline.

## Importing

```ts
import { importFile } from '@pollium/vyva-convert/import';

const { title, content } = await importFile(upload.bytes, upload.filename, {
    saveImage: async ({ name, data, contentType }) => (await files.store(name, data, contentType)).id
});
```

- The file is recognized by its content, not its name. Word and PowerPoint files are told apart
  by what their zip holds, and PDF by its signature. Only Markdown (`.md`) and text (`.txt`) are
  recognized by their extension, and only when they are valid UTF-8.
- Word, PDF, Markdown and text files become documents, and PowerPoint files become decks. A deck
  keeps its theme colors and font. What its slide master draws comes in locked, behind the slide's
  own elements.
- `saveImage` stores each image and returns its file id, which must be a UUID. Return `null` to
  leave the image out. If it throws, the import fails with your error.
- Files over 25 MB (`maxBytes` changes the limit) and files it cannot read are refused.

## Errors

Expected failures are a `ConvertError` from `@pollium/vyva-convert/errors`, with a `code`. Anything else is
a bug or a broken file, so log it.

| Code | Meaning |
|---|---|
| `unsupported` | The file is not one Vyva imports, or the content cannot be exported in that format |
| `too-large` | The file, or what it unzips to, is over the limit |
| `empty` | The file has nothing to import |
| `pdf-failed` | The PDF engine could not be reached or answered with an error |
