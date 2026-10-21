import InsertMenu from '../InsertMenu';
import ColorMenu from '../../editor/ColorMenu';
import LinkMenu from '../../editor/LinkMenu';
import ToolButton from '../../editor/ToolButton';
import ToolDivider from '../../editor/ToolDivider';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { BLOCK_STYLES, blockStyleOf, headingLevelOf, settleSelection, type BlockStyle } from '../../../utils/document-blocks';
import { textAttribute } from '../../../utils/editor-attributes';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { Baseline, Bold, Italic, Link2, List, ListOrdered, Redo2, Underline, Undo2 } from 'lucide-react';
import { useRef } from 'react';

interface DocumentToolbarProps{
    editor: Editor;
    isLocked: boolean;
    onInsertImage: (() => void) | undefined;
}

const DocumentToolbar = ({ editor, isLocked, onInsertImage }: DocumentToolbarProps) => {
    const t = useMessages();
    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
            block: blockStyleOf(current),
            color: textAttribute(current, 'textStyle', 'color'),
            isBold: current.isActive('bold'),
            isItalic: current.isActive('italic'),
            isUnderline: current.isActive('underline'),
            isBullet: current.isActive('bulletList'),
            isOrdered: current.isActive('orderedList'),
            isLink: current.isActive('link'),
            link: textAttribute(current, 'link', 'href'),
            isTable: current.isActive('table')
        })
    });
    const chain = () => editor.chain().focus();
    const linkRange = useRef<{ from: number; to: number } | null>(null);

    const setBlock = (value: BlockStyle) => {
        const level = headingLevelOf(value);
        if(level !== undefined) chain().setHeading({ level }).run();
        else if(value === 'quote') chain().setParagraph().toggleBlockquote().run();
        else if(value === 'code') chain().toggleCodeBlock().run();
        else chain().setParagraph().run();
    };

    return (
        <div role='toolbar' aria-label={t.document.formatting} className='vy:mx-auto vy:flex vy:max-w-full vy:shrink-0 vy:items-center vy:gap-0.5 vy:overflow-x-auto vy:overscroll-x-contain vy:px-1 vy:py-1 vy:max-lg:w-full vy:max-lg:border-b vy:max-lg:border-foreground/[0.06] vy:max-lg:px-2'>
            <ToolButton label={t.document.undo} disabled={isLocked || !state.canUndo} onClick={() => chain().undo().run()}><Undo2 className='vy:size-4' /></ToolButton>
            <ToolButton label={t.document.redo} disabled={isLocked || !state.canRedo} onClick={() => chain().redo().run()}><Redo2 className='vy:size-4' /></ToolButton>
            <ToolDivider />

            <SelectInput
                label={t.document.paragraphStyle}
                hideLabel
                className='vy:w-32 vy:shrink-0'
                value={state.block}
                options={BLOCK_STYLES.map((style) => ({ value: style, label: t.document.blockStyles[style] }))}
                isDisabled={isLocked}
                onChange={setBlock}
            />
            <ToolDivider />

            <ToolButton label={t.editor.bold} isActive={state.isBold} disabled={isLocked} onClick={() => chain().toggleBold().run()}><Bold className='vy:size-4' /></ToolButton>
            <ToolButton label={t.editor.italic} isActive={state.isItalic} disabled={isLocked} onClick={() => chain().toggleItalic().run()}><Italic className='vy:size-4' /></ToolButton>
            <ToolButton label={t.editor.underline} isActive={state.isUnderline} disabled={isLocked} onClick={() => chain().toggleUnderline().run()}><Underline className='vy:size-4' /></ToolButton>
            <ColorMenu
                label={t.document.textColor}
                value={state.color}
                allowNone
                isDisabled={isLocked}
                onPick={(color) => {
                    if(color === null) chain().unsetColor().run();
                    else chain().setColor(color).run();
                }}
                onClosed={() => settleSelection(editor)}
                icon={(
                    <span className='vy:flex vy:flex-col vy:items-center'>
                        <Baseline className='vy:size-4' />
                        <span className='vy:-mt-0.5 vy:h-1 vy:w-4 vy:rounded-full' style={{ background: state.color ?? 'currentColor' }} />
                    </span>
                )}
            />
            <LinkMenu
                current={state.link}
                isActive={state.isLink}
                isDisabled={isLocked}
                icon={<Link2 className='vy:size-4' />}
                onOpen={() => {
                    linkRange.current = { from: editor.state.selection.from, to: editor.state.selection.to };
                }}
                onApply={(href) => {
                    const range = linkRange.current ?? { from: editor.state.selection.from, to: editor.state.selection.to };
                    const restored = editor.chain().focus().setTextSelection(range).extendMarkRange('link');
                    if(href === null) restored.unsetLink().run();
                    else restored.setLink({ href }).run();
                }}
            />
            <ToolDivider />

            <ToolButton label={t.document.bulletList} isActive={state.isBullet} disabled={isLocked} onClick={() => chain().toggleBulletList().run()}><List className='vy:size-4' /></ToolButton>
            <ToolButton label={t.document.numberedList} isActive={state.isOrdered} disabled={isLocked} onClick={() => chain().toggleOrderedList().run()}><ListOrdered className='vy:size-4' /></ToolButton>
            <ToolDivider />

            <InsertMenu editor={editor} isLocked={isLocked} isTable={state.isTable} onInsertImage={onInsertImage} />
        </div>
    );
};

export default DocumentToolbar;
