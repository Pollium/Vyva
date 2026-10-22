import TableCellsEditor from '../TableCellsEditor';
import TextBoxEditor from '../TextBoxEditor';
import type { CellRef, DeckEditing } from '../../../contracts/deck-editing';
import { useMessages } from '../../../messages/context';
import type { DeckContent, SlideElement } from '@pollium/vyva-core/content';
import { shapeSvg, shapeTextCss, textCss } from '@pollium/vyva-core/render';
import { shapeTextStyle } from '@pollium/vyva-core/slide-layouts';
import type { Editor } from '@tiptap/react';

interface InlineEditorProps{
    element: SlideElement;
    deck: DeckContent;
    editing: DeckEditing;
    onCell: (cell: CellRef) => void;
    onCellChange: (rows: string[][]) => void;
    onTextChange: (html: string) => void;
    onTextEditor: (editor: Editor | null) => void;
    onDone: () => void;
}

const InlineEditor = ({ element, deck, editing, onCell, onCellChange, onTextChange, onTextEditor, onDone }: InlineEditorProps) => {
    const t = useMessages();

    if(editing.kind === 'cell' && element.type === 'table'){
        return <TableCellsEditor table={element} deck={deck} cell={editing.cell} onCell={onCell} onChange={onCellChange} onDone={onDone} />;
    }
    if(editing.kind !== 'text') return null;

    if(element.type === 'text'){
        return <TextBoxEditor html={element.html} css={textCss(element, deck)} caret={editing.caret} label={t.deck.boxText} onChange={onTextChange} onReady={onTextEditor} onDone={onDone} />;
    }
    if(element.type !== 'shape') return null;

    const text = element.text ?? { html: '', style: shapeTextStyle(element, deck.theme) };

    return (
        <div className='vy-shape'>
            <span className='vy:absolute vy:inset-0 vy:block' dangerouslySetInnerHTML={{ __html: shapeSvg(element) }} />
            <TextBoxEditor html={text.html} css={shapeTextCss({ ...element, text }, deck)} caret={editing.caret} label={t.deck.shapeText} onChange={onTextChange} onReady={onTextEditor} onDone={onDone} />
        </div>
    );
};

export default InlineEditor;
