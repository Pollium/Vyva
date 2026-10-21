import type { TextCaret } from '../../../contracts/deck-editing';
import { useMessages } from '../../../messages/context';
import { cssToStyle } from '../../../utils/deck/css-style';
import Highlight from '@tiptap/extension-highlight';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useState } from 'react';

const extensionsOf = (placeholder: string) => [
    StarterKit.configure({
        codeBlock: false,
        heading: false,
        blockquote: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'] }
    }),
    TextStyleKit.configure({ fontFamily: false }),
    Highlight.configure({ multicolor: true }),
    Placeholder.configure({ placeholder })
];

interface TextBoxEditorProps{
    html: string;
    css: string;
    caret: TextCaret;
    label: string;
    onChange: (html: string) => void;
    onReady: (editor: Editor | null) => void;
    onDone: () => void;
}

const placeCaret = (editor: Editor, caret: TextCaret) => {
    if(caret === 'all'){
        editor.commands.focus('end');
        editor.commands.selectAll();
        return;
    }
    if(caret === 'end'){
        editor.commands.focus('end');
        return;
    }

    const at = editor.view.posAtCoords({ left: caret.x, top: caret.y });
    if(at === null) editor.commands.focus('end');
    else editor.chain().focus().setTextSelection(at.pos).run();
};

const TextBoxEditor = ({ html, css, caret, label, onChange, onReady, onDone }: TextBoxEditorProps) => {
    const t = useMessages();
    const [initial] = useState(html);
    const [extensions] = useState(() => extensionsOf(t.deck.writeHere));
    const [initialCaret] = useState(caret);
    const editorProps = useMemo(() => ({ attributes: { class: 'vy:outline-none vy:min-h-full', 'aria-label': label } }), [label]);
    const editor = useEditor({
        extensions,
        content: initial,
        immediatelyRender: true,
        editorProps,
        onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML())
    });

    useEffect(() => {
        onReady(editor);
        placeCaret(editor, initialCaret);

        return () => onReady(null);
    }, [editor, initialCaret, onReady]);

    return (
        <div
            className='vy-text vy-text--editing vy:cursor-text'
            style={cssToStyle(css)}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                if(event.key === 'Escape'){
                    event.preventDefault();
                    event.stopPropagation();
                    onDone();
                }
            }}
        >
            <EditorContent editor={editor} className='vy:min-h-full' />
        </div>
    );
};

export default TextBoxEditor;
