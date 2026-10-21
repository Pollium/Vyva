import PanelSection from '../../editor/PanelSection';
import ToolButton from '../../editor/ToolButton';
import SliderField from '../../ui/SliderField';
import { useMessages } from '../../../messages/context';
import type { Align, Arrange } from '../../../utils/deck/deck-ops';
import type { SlideElement } from '@vyva/core/content';
import {
    AlignEndHorizontal,
    AlignEndVertical,
    AlignHorizontalJustifyCenter,
    AlignStartHorizontal,
    AlignStartVertical,
    AlignVerticalJustifyCenter,
    ArrowDownToLine,
    ArrowUpToLine,
    BringToFront,
    Lock,
    SendToBack,
    Unlock,
    type LucideIcon
} from 'lucide-react';

const MIN_OPACITY = 10;
const PERCENT: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent' };

const ARRANGES = [
    { value: 'front', icon: BringToFront },
    { value: 'forward', icon: ArrowUpToLine },
    { value: 'backward', icon: ArrowDownToLine },
    { value: 'back', icon: SendToBack }
] as const satisfies ReadonlyArray<{ value: Arrange; icon: LucideIcon }>;

const PLACEMENTS = [
    { value: 'left', icon: AlignStartVertical },
    { value: 'center', icon: AlignHorizontalJustifyCenter },
    { value: 'right', icon: AlignEndVertical },
    { value: 'top', icon: AlignStartHorizontal },
    { value: 'middle', icon: AlignVerticalJustifyCenter },
    { value: 'bottom', icon: AlignEndHorizontal }
] as const satisfies ReadonlyArray<{ value: Align; icon: LucideIcon }>;

interface ArrangeSectionProps{
    selection: SlideElement[];
    isLocked: boolean;
    onArrange: (how: Arrange) => void;
    onAlign: (how: Align) => void;
    onToggleLock: () => void;
    onPatch: (patch: (element: SlideElement) => SlideElement) => void;
}

const ArrangeSection = ({ selection, isLocked, onArrange, onAlign, onToggleLock, onPatch }: ArrangeSectionProps) => {
    const t = useMessages();
    const allLocked = selection.every((element) => element.isLocked);
    const opacity = selection.length === 1 ? selection[0].opacity : 1;

    return (
        <PanelSection title={t.deck.arrangeAndAlign}>
            <div className='vy:flex vy:flex-wrap vy:items-center vy:gap-0.5' role='group' aria-label={t.deck.order}>
                {ARRANGES.map(({ value, icon: Icon }) => (
                    <ToolButton key={value} label={t.deck.arranges[value]} disabled={isLocked} onClick={() => onArrange(value)}><Icon className='vy:size-4' /></ToolButton>
                ))}
                <ToolButton label={allLocked ? t.deck.unlock : t.deck.lock} isActive={allLocked} disabled={isLocked} onClick={onToggleLock}>
                    {allLocked ? <Unlock className='vy:size-4' /> : <Lock className='vy:size-4' />}
                </ToolButton>
            </div>
            <div className='vy:flex vy:flex-wrap vy:items-center vy:gap-0.5' role='group' aria-label={selection.length === 1 ? t.deck.alignOnSlide : t.deck.alignTogether}>
                {PLACEMENTS.map(({ value, icon: Icon }) => (
                    <ToolButton key={value} label={t.deck.placements[value]} disabled={isLocked} onClick={() => onAlign(value)}><Icon className='vy:size-4' /></ToolButton>
                ))}
            </div>
            <SliderField
                label={t.deck.opacity}
                value={Math.round(opacity * 100)}
                minValue={MIN_OPACITY}
                maxValue={100}
                formatOptions={PERCENT}
                isDisabled={isLocked}
                onChange={(percent) => onPatch((element) => ({ ...element, opacity: percent / 100 }))}
            />
        </PanelSection>
    );
};

export default ArrangeSection;
