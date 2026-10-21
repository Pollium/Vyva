# @vyva/react

The React viewer and editors for Vyva content: a `Viewer`, a Word-style `DocumentEditor`, a
Canva-style `DeckEditor` and a full-screen `PresentMode`. It needs React 19.

```sh
npm install @vyva/react @vyva/core react react-dom
```

## Setup

```tsx
import '@vyva/react/styles.css';
import '@vyva/react/fonts';
```

- **`styles.css`** is already built. Every class starts with `vy:`, so it never collides with the
  host's styles. Colors come from `--vy-color-*` variables, which the host can override. Dark mode
  turns on with `.dark` or `data-theme="dark"` on `:root`.
- **HeroUI hosts** also import `@vyva/react/heroui.css`, which points those variables at HeroUI's
  own colors.
- **`fonts`** loads the eight fonts documents and decks can use. Leave it out if the host already
  serves them under the same family names.

## A session

The editors edit a session, and the host decides where the content is stored.

```tsx
import { SaveConflict, useVyvaSession } from '@vyva/react/use-vyva-session';

const session = useVyvaSession({
    initial: { content: material.content, revision: material.revision },
    save: async (change, baseRevision) => {
        const response = await fetch(`/materials/${id}`, { method: 'PATCH', body: JSON.stringify({ ...change, baseRevision }) });
        if(response.status === 409) throw new SaveConflict();
        if(!response.ok) throw new Error('The material could not be saved');
        return response.json();
    },
    load: async () => (await fetch(`/materials/${id}`)).json()
});
```

- **Saving.** The session saves a moment after the last edit, and again before the page closes.
- **`save`** sends the change and the revision it was made on, and resolves to the stored content
  and its new revision.
- **Conflicts.** Throw `SaveConflict` when someone else saved first. The session stops saving
  until the user reloads or keeps their own version.
- **Unrecoverable failures.** Throw `SaveBlocked` when retrying cannot help, such as when the user
  lost access.
- **`SaveStatus`** shows the save state and offers those choices.

## The components

```tsx
import DocumentEditor from '@vyva/react/DocumentEditor';
import DeckEditor from '@vyva/react/DeckEditor';
import Viewer from '@vyva/react/Viewer';
import SaveStatus from '@vyva/react/SaveStatus';

<DocumentEditor session={session} readOnly={false} fileUrl={(fileId) => `/files/${fileId}`} />
<DeckEditor session={session} readOnly={false} fileUrl={fileUrl} imagePicker={MyImagePicker} />
<Viewer content={content} fileUrl={fileUrl} label='Unit 1' />
<SaveStatus session={session} />
```

| Prop | Editor | What it is |
|---|---|---|
| `session` | both | The session from `useVyvaSession` |
| `readOnly` | both | Shows the content without letting anyone change it |
| `fileUrl` | both | Turns a file id into the URL of the image. `null` leaves the image out |
| `imagePicker` | both | A component the editor opens to choose an image. It gets `isOpen`, `onOpenChange` and `onPick({ fileId, url, alt, credit })`. Without it there is no image button |
| `panel` | both | A tab the host adds beside the properties, such as an AI assistant: `{ label, icon, isBusy, actions?, content }` |
| `onSelectionAction` | document | Called with `improve`, `shorten`, `simplify` or `ask` and the selected text |
| `onImprove` | deck | Called with the selected element and its slide number |
| `codeEditor` | deck | The editor for code elements. A plain text area by default |
| `ref` | both | `showPanel()` opens the host's tab. The deck editor also has `present()` |

`PresentMode` shows a deck full screen and works with the keyboard and by touch. `Canvas` shows one
page from `@vyva/react/markup` (`slideMarkup` or `documentMarkup`), scaled to the width it is given,
which is what thumbnails need.

## Code editing with Monaco

`@vyva/react/MonacoCodeEditor` is a ready code editor for decks. It needs
`@monaco-editor/react`:

```tsx
import MonacoCodeEditor from '@vyva/react/MonacoCodeEditor';

<DeckEditor codeEditor={MonacoCodeEditor} ... />
```

`@monaco-editor/react` loads Monaco from a CDN. To serve it yourself, install `monaco-editor`
and call `loader.config({ monaco })` from `@monaco-editor/react` before the editor first renders.

## Language

The labels come in English and Spanish, and a host can bring its own. Numbers follow the locale
of React Aria's `I18nProvider`.

```tsx
import { MessagesContext } from '@vyva/react/messages/context';
import es from '@vyva/react/messages/es';
import { I18nProvider } from 'react-aria-components';

<I18nProvider locale='es'>
    <MessagesContext.Provider value={es}>
        <DeckEditor ... />
    </MessagesContext.Provider>
</I18nProvider>
```

A new language is an object typed as `Messages` from `@vyva/react/messages/en`, so TypeScript
lists every label it still needs.
