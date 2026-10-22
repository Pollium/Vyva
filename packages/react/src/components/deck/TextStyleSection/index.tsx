import ColorMenu from '../../editor/ColorMenu';
import PanelRow from '../../editor/PanelRow';
import PanelSection from '../../editor/PanelSection';
import ToolButton from '../../editor/ToolButton';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { textStyleOf, withTextStyle } from '../../../utils/deck/deck-ops';
import { numberOptions } from '../../../utils/deck/number-options';
import { TEXT_SIZES } from '../../../utils/deck/text-sizes';
import type { DeckTheme, SlideElement, TextStyle } from '@pollium/vyva-core/content';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, Baseline, Bold, PaintBucket } from 'lucide-react';
import { useLocale } from 'react-aria-components';

const LINE_HEIGHTS = [1, 1.15, 1.3, 1.5, 1.75, 2];

const ALIGNS = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight },
    { value: 'justify', icon: AlignJustify }
] as const;

const VERTICAL_ALIGNS = [
    { value: 'top', icon: AlignVerticalJustifyStart },
    { value: 'middle', icon: AlignVerticalJustifyCenter },
    { value: 'bottom', icon: AlignVerticalJustifyEnd }
] as const;

interface TextStyleSectionProps{
    element: SlideElement;
    theme: DeckTheme;
    isLocked: boolean;
    onPatch: (patch: (element: SlideElement) => SlideElement) => void;
}

const TextStyleSection = ({ element, theme, isLocked, onPatch }: TextStyleSectionProps) => {
    const t = useMessages();
    const { locale } = useLocale();
    const style = textStyleOf(element, theme);
    if(style === null) return null;

    const restyle = (change: (current: TextStyle) => TextStyle) => onPatch((current) => withTextStyle(current, change, theme));
    const lineHeightOf = (value: number) => t.deck.lineHeightOf(new Intl.NumberFormat(locale).format(value));

    return (
        <PanelSection title={t.deck.textStyle}>
            <div className='vy:grid vy:grid-cols-2 vy:gap-2'>
                <SelectInput label={t.editor.fontSize} hideLabel isDisabled={isLocked} value={String(style.fontSize)} options={numberOptions(TEXT_SIZES, style.fontSize, (size) => `${size} px`)} onChange={(value) => restyle((current) => ({ ...current, fontSize: Number(value) }))} />
                <SelectInput label={t.deck.lineHeight} hideLabel isDisabled={isLocked} value={String(style.lineHeight)} options={numberOptions(LINE_HEIGHTS, style.lineHeight, lineHeightOf)} onChange={(value) => restyle((current) => ({ ...current, lineHeight: Number(value) }))} />
            </div>
            <div className='vy:flex vy:flex-wrap vy:items-center vy:gap-0.5'>
                <ToolButton label={t.editor.bold} isActive={style.isBold} disabled={isLocked} onClick={() => restyle((current) => ({ ...current, isBold: !current.isBold }))}><Bold className='vy:size-4' /></ToolButton>
                {ALIGNS.map(({ value, icon: Icon }) => (
                    <ToolButton key={value} label={t.editor.textAligns[value]} isActive={style.align === value} disabled={isLocked} onClick={() => restyle((current) => ({ ...current, align: value }))}><Icon className='vy:size-4' /></ToolButton>
                ))}
                {VERTICAL_ALIGNS.map(({ value, icon: Icon }) => (
                    <ToolButton key={value} label={t.deck.verticalAligns[value]} isActive={style.verticalAlign === value} disabled={isLocked} onClick={() => restyle((current) => ({ ...current, verticalAlign: value }))}><Icon className='vy:size-4' /></ToolButton>
                ))}
            </div>
            <PanelRow label={t.deck.fontColor}>
                <ColorMenu label={t.deck.fontColor} value={style.color} isDisabled={isLocked} onPick={(color) => color !== null && restyle((current) => ({ ...current, color }))} icon={<Baseline className='vy:size-4' />} />
            </PanelRow>
            {element.type === 'text' ? (
                <PanelRow label={t.deck.boxFill}>
                    <ColorMenu label={t.deck.boxFill} value={element.fill} allowNone isDisabled={isLocked} onPick={(color) => onPatch((current) => current.type === 'text' ? { ...current, fill: color } : current)} icon={<PaintBucket className='vy:size-4' />} />
                </PanelRow>
            ) : null}
        </PanelSection>
    );
};

export default TextStyleSection;
