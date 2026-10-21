import AltTextMenu from '../../editor/AltTextMenu';
import PanelRow from '../../editor/PanelRow';
import PanelSection from '../../editor/PanelSection';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { numberOptions } from '../../../utils/deck/number-options';
import type { ImageElement } from '@vyva/core/content';

const ROUND_RADIUS = 999;
const RADII = [0, 12, 24, 48, ROUND_RADIUS];
const IMAGE_FITS = ['cover', 'contain'] as const;

interface SlideImageSectionProps{
    image: ImageElement;
    isLocked: boolean;
    onPatch: (change: (image: ImageElement) => ImageElement) => void;
}

const SlideImageSection = ({ image, isLocked, onPatch }: SlideImageSectionProps) => {
    const t = useMessages();

    const cornersOf = (radius: number) => {
        if(radius === 0) return t.deck.squareCorners;
        if(radius === ROUND_RADIUS) return t.deck.roundCorners;

        return t.deck.cornerRadius(radius);
    };

    return (
        <PanelSection title={t.deck.image}>
            <div className='vy:grid vy:grid-cols-2 vy:gap-2'>
                <SelectInput label={t.deck.imageFit} hideLabel isDisabled={isLocked} value={image.fit} options={IMAGE_FITS.map((fit) => ({ value: fit, label: t.deck.imageFits[fit] }))} onChange={(fit) => onPatch((current) => ({ ...current, fit }))} />
                <SelectInput label={t.deck.corners} hideLabel isDisabled={isLocked} value={String(image.radius)} options={numberOptions(RADII, image.radius, cornersOf)} onChange={(value) => onPatch((current) => ({ ...current, radius: Number(value) }))} />
            </div>
            <PanelRow label={t.editor.altText}>
                <AltTextMenu key={image.id} value={image.alt} isDisabled={isLocked} onApply={(alt) => onPatch((current) => ({ ...current, alt }))} />
            </PanelRow>
        </PanelSection>
    );
};

export default SlideImageSection;
