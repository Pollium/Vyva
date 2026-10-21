import ImageGallery from './ImageGallery';
import { fileUrl } from './gallery';
import { SAMPLE_DECK, SAMPLE_DOCUMENT } from './samples';
import { useMemorySession } from './use-memory-session';
import DeckEditor, { type DeckEditorHandle } from '@vyva/react/DeckEditor';
import DocumentEditor from '@vyva/react/DocumentEditor';
import SaveStatus from '@vyva/react/SaveStatus';
import Viewer from '@vyva/react/Viewer';
import { MessagesContext } from '@vyva/react/messages/context';
import en from '@vyva/react/messages/en';
import es from '@vyva/react/messages/es';
import { useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';

const TABS = ['deck', 'document', 'viewer'] as const;
const LANGUAGES = { en, es };

type Tab = typeof TABS[number];
type Language = keyof typeof LANGUAGES;

const App = () => {
    const [tab, setTab] = useState<Tab>('deck');
    const [language, setLanguage] = useState<Language>('en');
    const [readOnly, setReadOnly] = useState(false);
    const deck = useMemorySession(SAMPLE_DECK);
    const document = useMemorySession(SAMPLE_DOCUMENT);
    const deckEditor = useRef<DeckEditorHandle | null>(null);

    return (
        <I18nProvider locale={language}>
            <MessagesContext.Provider value={LANGUAGES[language]}>
                <div className='flex h-dvh flex-col bg-zinc-50 text-zinc-900'>
                    <header className='flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2 text-sm'>
                        <strong className='text-base'>Vyva</strong>
                        <nav className='flex gap-1' aria-label='Playground'>
                            {TABS.map((name) => (
                                <button key={name} type='button' aria-pressed={tab === name} onClick={() => setTab(name)} className='rounded-full px-3 py-1 capitalize aria-pressed:bg-zinc-900 aria-pressed:text-white'>
                                    {name}
                                </button>
                            ))}
                        </nav>
                        <label className='flex items-center gap-1.5'>
                            <input type='checkbox' checked={readOnly} onChange={(event) => setReadOnly(event.target.checked)} />
                            Read only
                        </label>
                        <select aria-label='Language' value={language} onChange={(event) => setLanguage(event.target.value === 'es' ? 'es' : 'en')} className='rounded-md border border-zinc-300 px-2 py-1'>
                            <option value='en'>English</option>
                            <option value='es'>Español</option>
                        </select>
                        {tab === 'deck' ? <button type='button' onClick={() => deckEditor.current?.present()} className='rounded-full px-3 py-1 ring-1 ring-zinc-300'>Present</button> : null}
                        <span className='ml-auto'>
                            {tab === 'viewer' ? null : <SaveStatus session={tab === 'deck' ? deck : document} />}
                        </span>
                    </header>

                    <main className='flex min-h-0 flex-1'>
                        {tab === 'deck' ? <DeckEditor ref={deckEditor} session={deck} readOnly={readOnly} fileUrl={fileUrl} imagePicker={ImageGallery} onImprove={(element, slideNumber) => window.alert(`Improve the ${element.type} on slide ${slideNumber}`)} /> : null}
                        {tab === 'document' ? <DocumentEditor session={document} readOnly={readOnly} fileUrl={fileUrl} imagePicker={ImageGallery} /> : null}
                        {tab === 'viewer' ? <div className='mx-auto w-full max-w-4xl overflow-auto p-6'><Viewer content={deck.content} fileUrl={fileUrl} label='Sample deck' /></div> : null}
                    </main>
                </div>
            </MessagesContext.Provider>
        </I18nProvider>
    );
};

export default App;
