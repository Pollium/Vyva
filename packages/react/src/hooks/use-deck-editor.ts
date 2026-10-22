import type { DeckEditing } from '../contracts/deck-editing';
import type { EditorSession } from '../contracts/editor-session';
import { useDeckHistory, type DeckHistory } from './use-deck-history';
import { useLiveEdit, type LiveEdit } from './use-live-edit';
import type { StepDirection } from './use-wheel-step';
import { deckOf } from '../utils/content-kind';
import { cloneElements, duplicateSlide, holdsText, insertElements, insertSlide, moveSlide, newText, removeElements, removeSlide, updateElements } from '../utils/deck/deck-ops';
import type { LayoutPreset } from '../utils/deck/layout-presets';
import type { DeckContent, Slide, SlideElement } from '@pollium/vyva-core/content';
import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ImageTarget =
    | { kind: 'add' }
    | { kind: 'replace' }
    | { kind: 'background' }
    | { kind: 'new-slide'; preset: LayoutPreset }
    | { kind: 'relayout'; at: number; preset: LayoutPreset };

export type DeckDialog =
    | { kind: 'image'; target: ImageTarget }
    | { kind: 'layout'; at: number }
    | { kind: 'table'; id: string }
    | { kind: 'code'; id: string };

interface DeckEditorOptions{
    session: EditorSession;
    readOnly: boolean;
}

export interface DeckEditorState{
    history: DeckHistory;
    live: LiveEdit;
    deck: DeckContent;
    index: number;
    slide: Slide;
    selected: string[];
    selection: SlideElement[];
    editing: DeckEditing | null;
    textEditor: Editor | null;
    dialog: DeckDialog | null;
    setTextEditor: (editor: Editor | null) => void;
    setEditing: (editing: DeckEditing | null) => void;
    select: (ids: string[]) => void;
    openDialog: (dialog: DeckDialog) => void;
    closeDialog: () => void;
    apply: (change: (deck: DeckContent) => DeckContent) => void;
    goTo: (index: number) => void;
    step: (direction: StepDirection) => void;
    startEditing: (editing: DeckEditing) => void;
    finishEditing: () => void;
    editSelected: () => void;
    add: (element: SlideElement) => void;
    addText: (text: string) => void;
    patch: (change: (element: SlideElement) => SlideElement) => void;
    insertCopies: (elements: SlideElement[]) => void;
    remove: () => void;
    addSlide: (slide: Slide) => void;
    moveSlideTo: (from: number, to: number) => void;
    duplicateSlideAt: (index: number) => void;
    removeSlideAt: (index: number) => void;
}

export const useDeckEditor = ({ session, readOnly }: DeckEditorOptions): DeckEditorState => {
    const { change } = session;
    const save = useCallback((deck: DeckContent) => change({ content: deck }), [change]);
    const [initial] = useState(() => deckOf(session.content));
    const history = useDeckHistory(initial, save);
    const live = useLiveEdit(history);
    const { deck, commit, snapshot, adopt } = history;
    const { finish } = live;
    const [slideIndex, setSlideIndex] = useState(0);
    const [selected, setSelected] = useState<string[]>([]);
    const [editing, setEditing] = useState<DeckEditing | null>(null);
    const [textEditor, setTextEditor] = useState<Editor | null>(null);
    const [dialog, setDialog] = useState<DeckDialog | null>(null);
    const [wasReadOnly, setWasReadOnly] = useState(readOnly);
    const appliedVersion = useRef(session.remoteVersion);
    const index = Math.min(slideIndex, deck.slides.length - 1);
    const slide = deck.slides[index];
    const selection = slide.elements.filter((element) => selected.includes(element.id));

    if(readOnly !== wasReadOnly){
        setWasReadOnly(readOnly);
        if(readOnly){
            setEditing(null);
            setDialog(null);
        }
    }

    useEffect(() => {
        if(readOnly) finish();
    }, [readOnly, finish]);

    useEffect(() => {
        if(appliedVersion.current === session.remoteVersion) return;
        appliedVersion.current = session.remoteVersion;

        setEditing(null);
        adopt(deckOf(session.content));
    }, [adopt, session.content, session.remoteVersion]);

    const apply = (next: (current: DeckContent) => DeckContent) => commit(next(snapshot()));

    const finishEditing = useCallback(() => {
        finish();
        setEditing(null);
    }, [finish]);

    const startEditing = (next: DeckEditing) => {
        if(readOnly) return;
        if(editing !== null && editing.id !== next.id) finish();

        setSelected([next.id]);
        setEditing(next);
    };

    const editSelected = () => {
        const element = selection.length === 1 ? selection[0] : null;
        if(element === null || element.isLocked) return;

        if(element.type === 'table') startEditing({ kind: 'cell', id: element.id, cell: { row: 0, column: 0 } });
        else if(element.type === 'code') setDialog({ kind: 'code', id: element.id });
        else if(holdsText(element)) startEditing({ kind: 'text', id: element.id, caret: 'end' });
    };

    const goTo = (next: number) => {
        finishEditing();
        setSlideIndex(next);
        setSelected([]);
    };

    const step = (direction: StepDirection) => {
        const next = index + direction;
        if(next >= 0 && next < deck.slides.length) goTo(next);
    };

    const add = (element: SlideElement) => {
        finishEditing();
        apply((current) => insertElements(current, index, [element]));
        setSelected([element.id]);
    };

    const addText = (text: string) => {
        const element = newText(snapshot(), text);
        add(element);
        setEditing({ kind: 'text', id: element.id, caret: 'all' });
    };

    const insertCopies = (elements: SlideElement[]) => {
        const copies = cloneElements(elements);
        apply((current) => insertElements(current, index, copies));
        setSelected(copies.map((element) => element.id));
    };

    const remove = () => {
        apply((current) => removeElements(current, index, selected));
        setSelected([]);
    };

    const addSlide = (next: Slide) => {
        const at = snapshot().slides.length;
        apply((current) => insertSlide(current, at, next));
        goTo(at);
    };

    return {
        history,
        live,
        deck,
        index,
        slide,
        selected,
        selection,
        editing,
        textEditor,
        dialog,
        setTextEditor,
        setEditing,
        select: setSelected,
        openDialog: setDialog,
        closeDialog: () => setDialog(null),
        apply,
        goTo,
        step,
        startEditing,
        finishEditing,
        editSelected,
        add,
        addText,
        patch: (next) => apply((current) => updateElements(current, index, selected, next)),
        insertCopies,
        remove,
        addSlide,
        moveSlideTo: (from, to) => {
            apply((current) => moveSlide(current, from, to));
            goTo(to);
        },
        duplicateSlideAt: (at) => {
            apply((current) => duplicateSlide(current, at));
            goTo(at + 1);
        },
        removeSlideAt: (at) => {
            apply((current) => removeSlide(current, at));
            goTo(Math.max(0, at - 1));
        }
    };
};
