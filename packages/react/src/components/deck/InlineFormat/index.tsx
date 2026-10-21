import ColorMenu from '../../editor/ColorMenu';
import ToolButton from '../../editor/ToolButton';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { TEXT_SIZES } from '../../../utils/deck/text-sizes';
import { textAttribute } from '../../../utils/editor-attributes';
import { useEditorState, type Editor } from '@tiptap/react';
import { Baseline, Bold, Highlighter, Italic, List, ListOrdered, Strikethrough, Underline } from 'lucide-react';

const AUTO_SIZE = 'auto';

interface InlineFormatProps{
    editor: Editor;
    isCompact?: boolean;
}

const InlineFormat = ({ editor, isCompact = false }: InlineFormatProps) => {
    const t = useMessages();
    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            isBold: current.isActive('bold'),
            isItalic: current.isActive('italic'),
            isUnderline: current.isActive('underline'),
            isStrike: current.isActive('strike'),
            isBullet: current.isActive('bulletList'),
            isOrdered: current.isActive('orderedList'),
            color: textAttribute(current, 'textStyle', 'color'),
            highlight: textAttribute(current, 'highlight', 'color'),
            size: (textAttribute(current, 'textStyle', 'fontSize') ?? '').replace('px', '')
        })
    });
    const chain = () => editor.chain().focus();
    const sizes = TEXT_SIZES.map(String);

    return (
        <>
            <SelectInput
                label={t.deck.selectedTextSize}
                hideLabel
                className='vy:w-24'
                value={sizes.includes(state.size) ? state.size : AUTO_SIZE}
                options={[{ value: AUTO_SIZE, label: t.deck.auto }, ...sizes.map((size) => ({ value: size, label: size }))]}
                onChange={(value) => value === AUTO_SIZE ? chain().unsetFontSize().run() : chain().setFontSize(`${value}px`).run()}
            />
            <ToolButton label={t.editor.bold} isActive={state.isBold} onClick={() => chain().toggleBold().run()}><Bold className='vy:size-4' /></ToolButton>
            <ToolButton label={t.editor.italic} isActive={state.isItalic} onClick={() => chain().toggleItalic().run()}><Italic className='vy:size-4' /></ToolButton>
            {isCompact ? null : (
                <>
                    <ToolButton label={t.editor.underline} isActive={state.isUnderline} onClick={() => chain().toggleUnderline().run()}><Underline className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.deck.strikethrough} isActive={state.isStrike} onClick={() => chain().toggleStrike().run()}><Strikethrough className='vy:size-4' /></ToolButton>
                </>
            )}
            <ColorMenu label={t.deck.selectedTextColor} value={state.color} allowNone onPick={(color) => color === null ? chain().unsetColor().run() : chain().setColor(color).run()} icon={<Baseline className='vy:size-4' />} />
            {isCompact ? null : (
                <>
                    <ColorMenu label={t.editor.highlight} value={state.highlight} allowNone onPick={(color) => color === null ? chain().unsetHighlight().run() : chain().setHighlight({ color }).run()} icon={<Highlighter className='vy:size-4' />} />
                    <ToolButton label={t.deck.bullets} isActive={state.isBullet} onClick={() => chain().toggleBulletList().run()}><List className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.deck.numbering} isActive={state.isOrdered} onClick={() => chain().toggleOrderedList().run()}><ListOrdered className='vy:size-4' /></ToolButton>
                </>
            )}
        </>
    );
};

export default InlineFormat;
