# @pollium/vyva-convert

Server-side tools for Vyva content. It cleans what clients send, imports Word, PowerPoint, PDF,
OpenDocument, RTF, Markdown, text and image files, and exports to PDF, Word, PowerPoint and HTML.
It runs in Node.

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
| Deck of PDF pages | `pdf` |

`exportFormatsOf(content)` lists them, and `canExport(content, format)` checks one.

- `readImage` is called once for every image the content uses. Return `null` and the export goes
  on without that image.
- The PDF fonts and images travel with the page, so the PDF engine needs no network access.
- `pdfEngine` is only needed for `pdf`. It is a function that takes a `PdfJob` (the HTML, the files
  it refers to by name, a footer with Chromium's `pageNumber` and `totalPages` classes, and the
  page size in inches) and returns the PDF. Use `gotenberg` or write your own with Puppeteer or
  Playwright.
- The `html` export is one self-contained file, with its images and fonts inline.
- A deck of PDF pages exports as the original PDF, read through `readImage`, with what the slides
  add printed on top of each page. Pages with nothing added are copied as they are, and a deck
  nobody drew on never reaches the PDF engine. An encrypted PDF is refused as `unsupported`.

## Importing

```ts
import { importFile } from '@pollium/vyva-convert/import';

const { title, content } = await importFile(upload.bytes, upload.filename, {
    saveImage: async ({ name, data, contentType }) => (await files.store(name, data, contentType)).id
});
```

- The file is recognized by its content, not its name. Word, PowerPoint and OpenDocument files
  are told apart by what their zip holds, Word 97 and PowerPoint 97 files by the streams they hold,
  and PDF, RTF, PNG, JPEG, GIF and WebP by their signatures. Only Markdown (`.md`) and text
  (`.txt`) are recognized by their extension, and only when they are valid UTF-8.
- Word, Markdown and text files become documents, and PowerPoint files become decks. A deck
  keeps its theme colors and the font most of its text uses. What its slide master draws comes in
  locked, behind the slide's own elements, and freeform shapes come in as polygons.
- A PDF becomes a deck of its own pages: one slide for each page, at the size of the first page,
  with that page behind it. Nothing is converted, so it looks exactly like the original.
  `saveImage` stores the PDF once, as `application/pdf`; return `null` and the import is refused as
  `empty`. A PDF Vyva cannot open is refused as `unsupported`, and one of more than 1000 pages as
  `too-large`.
- A picture becomes a deck of one slide, in the format closest to its shape, with the picture
  filling it. `saveImage` stores it like any other image; return `null` and the import is refused
  as `empty`.
- With `officeEngine`, Vyva reads what it cannot read alone. Word 97, OpenDocument text and RTF
  files are turned into Word, and PowerPoint 97 and OpenDocument presentations into PowerPoint,
  then imported as those. Without an engine those formats are refused as `unsupported`.

  `officeEngine` takes `{ file, from, to }` and returns the converted file. `libreOffice()` from
  `@pollium/vyva-convert/libreoffice` does that with the `soffice` on the machine (`command` changes
  the path), one conversion per call:

  ```ts
  import { libreOffice } from '@pollium/vyva-convert/libreoffice';

  await importFile(upload.bytes, upload.filename, { saveImage, officeEngine: libreOffice() });
  ```
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
| `office-failed` | `officeEngine` could not convert the file, or answered with something else |
