import ToolPopover from '../ToolPopover';
import Button from '../../ui/Button';
import ColorInput from '../../ui/ColorInput';
import { useMessages } from '../../../messages/context';
import { ColorSwatch, ColorSwatchPicker, ColorSwatchPickerItem } from 'react-aria-components';
import type { ReactNode } from 'react';

const SWATCHES = ['#1d2433', '#5b6475', '#1f4e9a', '#2f6fed', '#0f7b6c', '#3fb950', '#c4572e', '#d1242f', '#8250df', '#bf8700', '#ffffff', '#000000'];
const FALLBACK_COLOR = '#1f4e9a';
const NO_SWATCH = '#00000000';

interface ColorMenuProps{
    label: string;
    value: string | null;
    icon: ReactNode;
    isDisabled?: boolean;
    allowNone?: boolean;
    onPick: (color: string | null) => void;
    onClosed?: () => void;
}

const ColorMenu = ({ label, value, icon, isDisabled = false, allowNone = false, onPick, onClosed }: ColorMenuProps) => {
    const t = useMessages();

    return (
        <ToolPopover label={label} icon={icon} isDisabled={isDisabled} onClosed={onClosed}>
            {(close) => (
                <div className='vy:flex vy:flex-col vy:gap-3'>
                    <span className='vy:text-[0.8125rem] vy:font-medium vy:text-foreground'>{label}</span>
                    <ColorSwatchPicker
                        aria-label={label}
                        layout='grid'
                        className='vy:grid vy:grid-cols-6 vy:gap-1.5'
                        value={value ?? NO_SWATCH}
                        onChange={(color) => {
                            onPick(color.toString('hex').toLowerCase());
                            close();
                        }}
                    >
                        {SWATCHES.map((color) => (
                            <ColorSwatchPickerItem key={color} color={color} className='vy:rounded-md vy:outline-none vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-offset-2 vy:data-focus-visible:outline-foreground vy:data-selected:ring-2 vy:data-selected:ring-foreground vy:data-selected:ring-offset-2 vy:data-selected:ring-offset-background'>
                                <ColorSwatch className='vy:size-7 vy:rounded-md vy:ring-1 vy:ring-inset vy:ring-foreground/10' />
                            </ColorSwatchPickerItem>
                        ))}
                    </ColorSwatchPicker>
                    <ColorInput label={t.editor.otherColor} value={value ?? FALLBACK_COLOR} onChange={onPick} />
                    {allowNone ? (
                        <Button
                            size='sm'
                            variant='ghost'
                            className='vy:self-start'
                            onPress={() => {
                                onPick(null);
                                close();
                            }}
                        >
                            {t.editor.removeColor}
                        </Button>
                    ) : null}
                </div>
            )}
        </ToolPopover>
    );
};

export default ColorMenu;
