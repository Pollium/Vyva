import { ColorSwatch, ColorSwatchPicker, ColorSwatchPickerItem } from 'react-aria-components';

const NO_SWATCH = '#00000000';

interface SwatchGridProps{
    label: string;
    colors: readonly string[];
    value: string | null;
    onPick: (color: string) => void;
}

const SwatchGrid = ({ label, colors, value, onPick }: SwatchGridProps) => (
    <ColorSwatchPicker
        aria-label={label}
        layout='grid'
        className='vy:grid vy:grid-cols-6 vy:gap-1.5'
        value={value ?? NO_SWATCH}
        onChange={(color) => onPick(color.toString('hex').toLowerCase())}
    >
        {colors.map((color) => (
            <ColorSwatchPickerItem key={color} color={color} className='vy:rounded-md vy:outline-none vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-offset-2 vy:data-focus-visible:outline-foreground vy:data-selected:ring-2 vy:data-selected:ring-foreground vy:data-selected:ring-offset-2 vy:data-selected:ring-offset-background'>
                <ColorSwatch className='vy:size-7 vy:rounded-md vy:ring-1 vy:ring-inset vy:ring-foreground/10' />
            </ColorSwatchPickerItem>
        ))}
    </ColorSwatchPicker>
);

export default SwatchGrid;
