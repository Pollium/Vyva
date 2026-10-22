import Popover from '../../ui/Popover';
import MenuItem from '../../ui/MenuItem';
import { useMessages } from '../../../messages/context';
import { ChevronUp } from 'lucide-react';
import { Button, Menu, MenuTrigger, Separator, useLocale } from 'react-aria-components';

const STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3];
const PRESETS = [0.5, 1, 2];
const STEP_TOLERANCE = 0.01;
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

interface ZoomControlProps{
    scale: number;
    isFit: boolean;
    onZoom: (scale: number | null) => void;
}

const ZoomControl = ({ scale, isFit, onZoom }: ZoomControlProps) => {
    const t = useMessages();
    const { locale } = useLocale();
    const percent = (value: number) => new Intl.NumberFormat(locale, PERCENT).format(value);
    const smaller = STEPS.filter((step) => step < scale - STEP_TOLERANCE).at(-1);
    const larger = STEPS.find((step) => step > scale + STEP_TOLERANCE);

    return (
        <MenuTrigger>
            <Button aria-label={t.deck.zoomAt(percent(scale))} className='vy:inline-flex vy:h-8 vy:cursor-default vy:items-center vy:gap-1 vy:rounded-full vy:px-2 vy:text-[0.8125rem] vy:tabular-nums vy:text-muted vy:outline-none vy:data-hovered:bg-foreground/[0.06] vy:data-hovered:text-foreground vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-foreground'>
                {percent(scale)}
                <ChevronUp className='vy:size-3.5' aria-hidden='true' />
            </Button>
            <Popover placement='top' className='vy-ui'>
                <Menu aria-label={t.deck.zoom} className='vy:min-w-48 vy:p-1.5 vy:outline-none'>
                    <MenuItem isDisabled={larger === undefined} onAction={() => larger !== undefined && onZoom(larger)}>{t.deck.zoomIn}</MenuItem>
                    <MenuItem isDisabled={smaller === undefined} onAction={() => smaller !== undefined && onZoom(smaller)}>{t.deck.zoomOut}</MenuItem>
                    <MenuItem isDisabled={isFit} onAction={() => onZoom(null)}>{t.deck.zoomToFit}</MenuItem>
                    <Separator className='vy:my-1 vy:h-px vy:bg-foreground/[0.08]' />
                    {PRESETS.map((preset) => (
                        <MenuItem key={preset} textValue={percent(preset)} onAction={() => onZoom(preset)}>{percent(preset)}</MenuItem>
                    ))}
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};

export default ZoomControl;
