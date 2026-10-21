import { useMessages } from '../../../messages/context';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { Plus } from 'lucide-react';

const OUTLINE_LEVELS = 3;
const NEW_SECTION_LEVEL = 2;

interface OutlineHeading{
    pos: number;
    level: number;
    text: string;
}

const headingsOf = (editor: Editor): OutlineHeading[] => {
    const headings: OutlineHeading[] = [];
    editor.state.doc.forEach((node, pos) => {
        if(node.type.name !== 'heading') return;
        const level = Number(node.attrs.level);
        if(level <= OUTLINE_LEVELS) headings.push({ pos, level, text: node.textContent.trim() });
    });

    return headings;
};

const sameHeadings = (left: OutlineHeading[], right: OutlineHeading[]): boolean =>
    left.length === right.length && left.every((heading, index) => heading.pos === right[index].pos && heading.level === right[index].level && heading.text === right[index].text);

interface DocumentOutlineProps{
    editor: Editor;
    isLocked: boolean;
}

const DocumentOutline = ({ editor, isLocked }: DocumentOutlineProps) => {
    const t = useMessages();
    const { headings, current } = useEditorState({
        editor,
        selector: ({ editor: state }) => {
            const found = headingsOf(state);
            const from = state.state.selection.from;

            return { headings: found, current: found.findLastIndex((heading) => heading.pos < from) };
        },
        equalityFn: (previous, next) => next !== null && previous.current === next.current && sameHeadings(previous.headings, next.headings)
    });
    const topLevel = Math.min(...headings.map((heading) => heading.level));

    const goTo = (pos: number) => {
        editor.chain().focus().setTextSelection(pos + 1).run();
        const node = editor.view.nodeDOM(pos);
        if(node instanceof HTMLElement) node.scrollIntoView({ block: 'start' });
    };

    const addSection = () => {
        editor.chain().insertContentAt(editor.state.doc.content.size, { type: 'heading', attrs: { level: NEW_SECTION_LEVEL } }).focus('end').scrollIntoView().run();
    };

    return (
        <nav aria-label={t.document.outlineLabel} className='vy:hidden vy:w-56 vy:shrink-0 vy:flex-col vy:lg:flex'>
            <h2 className='vy:px-2.5 vy:pb-2 vy:pt-1 vy:text-[0.8125rem] vy:font-medium vy:text-muted'>{t.document.outline}</h2>
            <div className='vy:min-h-0 vy:flex-1 vy:overflow-y-auto vy:[scrollbar-width:none]'>
                {headings.length === 0 ? (
                    <p className='vy:px-2.5 vy:text-[0.8125rem] vy:text-muted'>{t.document.outlineEmpty}</p>
                ) : (
                    <ol className='vy:flex vy:flex-col vy:gap-px vy:pb-2'>
                        {headings.map((heading, index) => (
                            <li key={heading.pos}>
                                <button
                                    type='button'
                                    aria-current={index === current ? 'location' : undefined}
                                    onClick={() => goTo(heading.pos)}
                                    className={`vy:w-full vy:rounded-xl vy:px-2.5 vy:py-1.5 vy:text-left vy:leading-snug vy:transition-colors vy:hover:bg-foreground/[0.05] vy:motion-reduce:transition-none ${heading.level > topLevel ? 'vy:pl-6 vy:text-[0.8125rem] vy:text-muted' : 'vy:text-[0.8125rem] vy:text-foreground'} ${index === current ? 'vy:bg-surface vy:text-foreground vy:ring-1 vy:ring-foreground/[0.08]' : ''}`}
                                >
                                    {heading.text === '' ? <span className='vy:italic vy:text-muted'>{t.document.untitledSection}</span> : heading.text}
                                </button>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
            <button
                type='button'
                disabled={isLocked}
                onClick={addSection}
                className='vy:mt-2 vy:flex vy:h-10 vy:shrink-0 vy:items-center vy:justify-center vy:gap-1.5 vy:rounded-xl vy:border vy:border-dashed vy:border-foreground/15 vy:text-[0.8125rem] vy:text-muted vy:hover:border-foreground/30 vy:hover:text-foreground vy:disabled:opacity-50'
            >
                <Plus className='vy:size-4' aria-hidden='true' />
                {t.document.newSection}
            </button>
        </nav>
    );
};

export default DocumentOutline;
