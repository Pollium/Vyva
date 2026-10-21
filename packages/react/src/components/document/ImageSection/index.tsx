import AltTextMenu from '../../editor/AltTextMenu';
import PanelRow from '../../editor/PanelRow';
import PanelSection from '../../editor/PanelSection';
import ToolButton from '../../editor/ToolButton';
import SelectInput, { type SelectOption } from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { textAttribute } from '../../../utils/editor-attributes';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

const ORIGINAL_WIDTH = 'original';
const MANUAL_WIDTH = 'manual';
const FULL_WIDTH = '100%';
const PAGE_SHARES = [25, 50, 75];

const IMAGE_ALIGNS = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight }
] as const;

const widthOf = (value: unknown): string | number | null => typeof value === 'string' || typeof value === 'number' ? value : null;

interface ImageSectionProps{
    editor: Editor;
    isLocked: boolean;
}

const ImageSection = ({ editor, isLocked }: ImageSectionProps) => {
    const t = useMessages();
    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            align: IMAGE_ALIGNS.find(({ value }) => value === current.getAttributes('image').align)?.value ?? 'center',
            alt: textAttribute(current, 'image', 'alt') ?? '',
            width: widthOf(current.getAttributes('image').width)
        })
    });
    const chain = () => editor.chain().focus();
    const presets: SelectOption<string>[] = [
        { value: ORIGINAL_WIDTH, label: t.document.originalWidth },
        ...PAGE_SHARES.map((share) => ({ value: `${share}%`, label: t.document.pageShare(share) })),
        { value: FULL_WIDTH, label: t.document.fullWidth }
    ];
    const presetWidth = typeof state.width === 'string' && presets.some((option) => option.value === state.width) ? state.width : ORIGINAL_WIDTH;
    const width = typeof state.width === 'number' ? MANUAL_WIDTH : presetWidth;
    const widthOptions = typeof state.width === 'number'
        ? [{ value: MANUAL_WIDTH, label: t.document.manualWidth(Math.round(state.width)) }, ...presets.filter((option) => option.value !== ORIGINAL_WIDTH)]
        : presets;

    return (
        <PanelSection title={t.document.image}>
            <PanelRow label={t.document.position}>
                {IMAGE_ALIGNS.map((align) => (
                    <ToolButton key={align.value} label={t.document.imageAligns[align.value]} isActive={state.align === align.value} disabled={isLocked} onClick={() => chain().updateAttributes('image', { align: align.value }).run()}>
                        <align.icon className='vy:size-4' />
                    </ToolButton>
                ))}
            </PanelRow>
            <PanelRow label={t.document.width}>
                <SelectInput
                    label={t.document.imageWidth}
                    hideLabel
                    className='vy:w-40'
                    value={width}
                    options={widthOptions}
                    isDisabled={isLocked}
                    onChange={(next) => chain().updateAttributes('image', { width: next === ORIGINAL_WIDTH ? null : next }).run()}
                />
            </PanelRow>
            <PanelRow label={t.editor.altText}>
                <AltTextMenu key={state.alt} value={state.alt} isDisabled={isLocked} onApply={(alt) => chain().updateAttributes('image', { alt }).run()} />
            </PanelRow>
        </PanelSection>
    );
};

export default ImageSection;
