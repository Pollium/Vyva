import ColorMenu from '../../editor/ColorMenu';
import PanelRow from '../../editor/PanelRow';
import PanelSection from '../../editor/PanelSection';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { MIN_STROKE } from '../../../utils/deck/deck-ops';
import { numberOptions } from '../../../utils/deck/number-options';
import { SHAPES } from '../../../utils/deck/shape-kinds';
import type { ShapeElement, ShapeKind } from '@pollium/vyva-core/content';
import { PaintBucket, Square } from 'lucide-react';

const STROKE_WIDTHS = [0, 2, 4, 6, 8, 12, 16, 24];

interface ShapeSectionProps{
    shape: ShapeElement;
    isLocked: boolean;
    onPatch: (change: (shape: ShapeElement) => ShapeElement) => void;
}

const ShapeSection = ({ shape, isLocked, onPatch }: ShapeSectionProps) => {
    const t = useMessages();
    const strokeLabel = (width: number) => width === 0 ? t.deck.noBorder : `${width} px`;

    return (
        <PanelSection title={t.deck.shape}>
            <SelectInput label={t.deck.shapeKind} hideLabel isDisabled={isLocked} value={shape.shape} options={SHAPES.map(({ value }) => ({ value, label: t.deck.shapes[value] }))} onChange={(kind: ShapeKind) => onPatch((current) => ({ ...current, shape: kind }))} />
            <PanelRow label={t.deck.fill}>
                <ColorMenu label={t.deck.fill} value={shape.fill} allowNone isDisabled={isLocked} onPick={(fill) => onPatch((current) => ({ ...current, fill }))} icon={<PaintBucket className='vy:size-4' />} />
            </PanelRow>
            <PanelRow label={t.deck.border}>
                <SelectInput label={t.deck.borderWidth} hideLabel className='vy:w-32' isDisabled={isLocked} value={String(shape.strokeWidth)} options={numberOptions(STROKE_WIDTHS, shape.strokeWidth, strokeLabel)} onChange={(value) => onPatch((current) => ({ ...current, strokeWidth: Number(value) }))} />
                <ColorMenu label={t.deck.strokeColor} value={shape.stroke} allowNone isDisabled={isLocked} onPick={(stroke) => onPatch((current) => ({ ...current, stroke, strokeWidth: stroke === null ? 0 : Math.max(current.strokeWidth, MIN_STROKE) }))} icon={<Square className='vy:size-4' />} />
            </PanelRow>
        </PanelSection>
    );
};

export default ShapeSection;
