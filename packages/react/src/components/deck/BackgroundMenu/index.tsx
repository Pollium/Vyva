import MenuRow from '../../editor/MenuRow';
import SwatchGrid from '../../editor/SwatchGrid';
import ToolPopover from '../../editor/ToolPopover';
import ColorInput from '../../ui/ColorInput';
import SelectInput from '../../ui/SelectInput';
import SliderField from '../../ui/SliderField';
import { useMessages } from '../../../messages/context';
import { MAX_BACKGROUND_DIM, type DeckTheme, type SlideBackground } from '@vyva/core/content';
import { Image as ImageIcon, ImagePlus } from 'lucide-react';

const MENU_WIDTH = 256;
const PALETTE = ['#ffffff', '#f3f4f6', '#0f1720', '#e8eef8', '#fbf6ef', '#1f4e9a', '#0f7b6c', '#c4572e', '#8250df'];
const FITS = ['cover', 'contain'] as const;
const PERCENT: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent' };

interface BackgroundMenuProps{
    theme: DeckTheme;
    background: SlideBackground | null;
    onChange: (background: SlideBackground | null) => void;
    onPickImage: (() => void) | undefined;
    onDone: () => void;
}

const BackgroundMenu = ({ theme, background, onChange, onPickImage, onDone }: BackgroundMenuProps) => {
    const t = useMessages();
    const color = background?.type === 'color' ? background.color : theme.background;
    const swatches = [...new Set([theme.background, theme.accent, theme.text, ...PALETTE].map((swatch) => swatch.toLowerCase()))];
    const icon = background?.type === 'image'
        ? <ImageIcon className='vy:size-4' />
        : <span className='vy:size-5 vy:rounded-full vy:ring-1 vy:ring-foreground/15' style={{ background: color }} />;

    return (
        <ToolPopover label={t.deck.slideBackground} width={MENU_WIDTH} onClosed={onDone} icon={icon}>
            {(close) => (
                <div className='vy:flex vy:flex-col vy:gap-3'>
                    <SwatchGrid
                        label={t.deck.slideBackground}
                        colors={swatches}
                        value={background?.type === 'image' ? null : color.toLowerCase()}
                        onPick={(swatch) => {
                            onChange({ type: 'color', color: swatch });
                            close();
                        }}
                    />
                    <ColorInput label={t.editor.otherColor} value={color} onChange={(value) => onChange({ type: 'color', color: value })} onChangeEnd={onDone} />
                    {onPickImage === undefined ? null : (
                        <MenuRow
                            onClick={() => {
                                onPickImage();
                                close();
                            }}
                        >
                            <ImagePlus className='vy:size-4 vy:text-muted' aria-hidden='true' />
                            {background?.type === 'image' ? t.deck.changeImage : t.deck.useImage}
                        </MenuRow>
                    )}
                    {background?.type === 'image' ? (
                        <>
                            <SelectInput label={t.deck.backgroundFit} value={background.fit} options={FITS.map((fit) => ({ value: fit, label: t.deck.backgroundFits[fit] }))} onChange={(fit) => onChange({ ...background, fit })} />
                            <SliderField label={t.deck.dimImage} value={Math.round(background.dim * 100)} minValue={0} maxValue={MAX_BACKGROUND_DIM * 100} formatOptions={PERCENT} onChange={(value) => onChange({ ...background, dim: value / 100 })} onChangeEnd={onDone} />
                        </>
                    ) : null}
                    {background === null ? null : (
                        <MenuRow
                            onClick={() => {
                                onChange(null);
                                close();
                            }}
                        >
                            {t.deck.themeBackground}
                        </MenuRow>
                    )}
                </div>
            )}
        </ToolPopover>
    );
};

export default BackgroundMenu;
