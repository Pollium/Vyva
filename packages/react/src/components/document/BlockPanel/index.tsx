import ImageSection from '../ImageSection';
import TableSection from '../TableSection';
import ColorMenu from '../../editor/ColorMenu';
import PanelRow from '../../editor/PanelRow';
import PanelSection from '../../editor/PanelSection';
import ToolButton from '../../editor/ToolButton';
import SelectInput, { type SelectOption } from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { blockStyleOf, settleSelection } from '../../../utils/document-blocks';
import { textAttribute } from '../../../utils/editor-attributes';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Highlighter } from 'lucide-react';

const SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '40', '48'];
const AUTO_SIZE = 'auto';
const PLAIN_TEXT = 'plaintext';

const TEXT_ALIGNS = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight },
    { value: 'justify', icon: AlignJustify }
] as const;

const CODE_LANGUAGES: Array<{ value: string; label: string }> = [
    { value: 'arduino', label: 'Arduino' },
    { value: 'bash', label: 'Bash' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'css', label: 'CSS' },
    { value: 'go', label: 'Go' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'json', label: 'JSON' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'php', label: 'PHP' },
    { value: 'python', label: 'Python' },
    { value: 'r', label: 'R' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'rust', label: 'Rust' },
    { value: 'sql', label: 'SQL' },
    { value: 'swift', label: 'Swift' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'yaml', label: 'YAML' }
];

interface BlockPanelProps{
    editor: Editor;
    isLocked: boolean;
}

const BlockPanel = ({ editor, isLocked }: BlockPanelProps) => {
    const t = useMessages();
    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            kind: current.isActive('image') ? 'image' : current.isActive('table') ? 'table' : current.isActive('codeBlock') ? 'code' : 'text',
            block: blockStyleOf(current),
            align: TEXT_ALIGNS.find(({ value }) => current.isActive({ textAlign: value }))?.value ?? 'left',
            size: (textAttribute(current, 'textStyle', 'fontSize') ?? '').replace('px', ''),
            highlight: textAttribute(current, 'highlight', 'color'),
            language: textAttribute(current, 'codeBlock', 'language') ?? PLAIN_TEXT
        })
    });
    const chain = () => editor.chain().focus();

    if(state.kind === 'image') return <ImageSection editor={editor} isLocked={isLocked} />;
    if(state.kind === 'table') return <TableSection editor={editor} isLocked={isLocked} />;

    if(state.kind === 'code'){
        const languages: SelectOption<string>[] = [{ value: PLAIN_TEXT, label: t.document.plainText }, ...CODE_LANGUAGES, { value: 'xml', label: t.document.htmlOrXml }];

        return (
            <PanelSection title={t.document.code}>
                <PanelRow label={t.editor.language}>
                    <SelectInput
                        label={t.document.codeLanguage}
                        hideLabel
                        className='vy:w-40'
                        value={languages.some((language) => language.value === state.language) ? state.language : PLAIN_TEXT}
                        options={languages}
                        isDisabled={isLocked}
                        onChange={(language) => chain().updateAttributes('codeBlock', { language }).run()}
                    />
                </PanelRow>
            </PanelSection>
        );
    }

    return (
        <PanelSection title={t.document.blockStyles[state.block]}>
            <PanelRow label={t.document.alignment}>
                {TEXT_ALIGNS.map((align) => (
                    <ToolButton key={align.value} label={t.editor.textAligns[align.value]} isActive={state.align === align.value} disabled={isLocked} onClick={() => chain().setTextAlign(align.value).run()}>
                        <align.icon className='vy:size-4' />
                    </ToolButton>
                ))}
            </PanelRow>
            <PanelRow label={t.editor.fontSize}>
                <SelectInput
                    label={t.editor.fontSize}
                    hideLabel
                    className='vy:w-36'
                    value={SIZES.includes(state.size) ? state.size : AUTO_SIZE}
                    options={[{ value: AUTO_SIZE, label: t.document.automatic }, ...SIZES.map((size) => ({ value: size, label: `${size} px` }))]}
                    isDisabled={isLocked}
                    onChange={(size) => {
                        if(size === AUTO_SIZE) chain().unsetFontSize().run();
                        else chain().setFontSize(`${size}px`).run();
                    }}
                />
            </PanelRow>
            <PanelRow label={t.editor.highlight}>
                <ColorMenu
                    label={t.editor.highlight}
                    value={state.highlight}
                    allowNone
                    isDisabled={isLocked}
                    onPick={(color) => {
                        if(color === null) chain().unsetHighlight().run();
                        else chain().setHighlight({ color }).run();
                    }}
                    onClosed={() => settleSelection(editor)}
                    icon={<Highlighter className='vy:size-4' style={state.highlight === null ? undefined : { color: state.highlight }} />}
                />
            </PanelRow>
        </PanelSection>
    );
};

export default BlockPanel;
