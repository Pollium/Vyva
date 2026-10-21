import type { DeckEditorState } from './use-deck-editor';
import type { StepDirection } from './use-wheel-step';
import type { SlideElement } from '@vyva/core/content';
import { useRef, type KeyboardEvent } from 'react';

const NUDGE = 1;
const NUDGE_FAST = 10;
const SLIDE_KEYS: Record<string, StepDirection> = { arrowdown: 1, arrowright: 1, arrowup: -1, arrowleft: -1 };
const ARROWS: Record<string, [number, number]> = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
const ARROW_OWNERS = '[role="dialog"], [role="menu"], [role="listbox"], aside';
const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

const isTyping = (target: EventTarget): boolean =>
    target instanceof HTMLElement && (target.isContentEditable || TYPING_TAGS.includes(target.tagName));

const ownsArrows = (target: EventTarget): boolean => target instanceof Element && target.closest(ARROW_OWNERS) !== null;

interface DeckShortcutsOptions{
    editor: DeckEditorState;
    readOnly: boolean;
    isPresenting: boolean;
}

export const useDeckShortcuts = ({ editor, readOnly, isPresenting }: DeckShortcutsOptions) => {
    const clipboard = useRef<SlideElement[]>([]);
    const { history, selection } = editor;

    const onCommand = (key: string, isShift: boolean): boolean => {
        if(key === 'z'){
            if(isShift) history.redo();
            else history.undo();
            return true;
        }
        if(key === 'y'){
            history.redo();
            return true;
        }
        if(key === 'a'){
            editor.select(editor.slide.elements.map((element) => element.id));
            return true;
        }
        if(key === 'v' && clipboard.current.length > 0){
            editor.insertCopies(clipboard.current);
            return true;
        }
        if(selection.length === 0) return false;

        if(key === 'c' || key === 'x'){
            clipboard.current = selection;
            if(key === 'x') editor.remove();
            return true;
        }
        if(key === 'd'){
            editor.insertCopies(selection);
            return true;
        }

        return false;
    };

    const onSelectionKey = (key: string, isShift: boolean): boolean => {
        const arrow = ARROWS[key];
        if(arrow !== undefined){
            const distance = isShift ? NUDGE_FAST : NUDGE;
            editor.patch((element) => element.isLocked ? element : { ...element, x: element.x + arrow[0] * distance, y: element.y + arrow[1] * distance });
            return true;
        }
        if(key === 'enter' || key === 'f2'){
            editor.editSelected();
            return true;
        }
        if(key === 'delete' || key === 'backspace'){
            editor.remove();
            return true;
        }
        if(key === 'escape') editor.select([]);

        return false;
    };

    return (event: KeyboardEvent) => {
        if(isPresenting || event.defaultPrevented || isTyping(event.target)) return;

        const key = event.key.toLowerCase();
        const isCommand = event.metaKey || event.ctrlKey;
        const slideStep = SLIDE_KEYS[key];
        if(slideStep !== undefined && selection.length === 0 && !isCommand && !event.shiftKey && !event.altKey && !ownsArrows(event.target)){
            event.preventDefault();
            editor.step(slideStep);
            return;
        }
        if(readOnly || ownsArrows(event.target)) return;

        const isHandled = isCommand ? onCommand(key, event.shiftKey) : selection.length > 0 && onSelectionKey(key, event.shiftKey);
        if(isHandled) event.preventDefault();
    };
};
