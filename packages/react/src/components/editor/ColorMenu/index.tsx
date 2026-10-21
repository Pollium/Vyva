import SwatchGrid from '../SwatchGrid';
import ToolPopover from '../ToolPopover';
import Button from '../../ui/Button';
import ColorInput from '../../ui/ColorInput';
import { useMessages } from '../../../messages/context';
import type { ReactNode } from 'react';

const SWATCHES = ['#1d2433', '#5b6475', '#1f4e9a', '#2f6fed', '#0f7b6c', '#3fb950', '#c4572e', '#d1242f', '#8250df', '#bf8700', '#ffffff', '#000000'];
const FALLBACK_COLOR = '#1f4e9a';

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
                    <SwatchGrid
                        label={label}
                        colors={SWATCHES}
                        value={value}
                        onPick={(color) => {
                            onPick(color);
                            close();
                        }}
                    />
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
