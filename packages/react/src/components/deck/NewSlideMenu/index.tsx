import ToolPopover from '../../editor/ToolPopover';
import { useMessages } from '../../../messages/context';
import type { LayoutPreset } from '../../../utils/deck/layout-presets';
import { Plus } from 'lucide-react';

const MENU_WIDTH = 260;

interface NewSlideMenuProps{
    presets: LayoutPreset[];
    isLocked: boolean;
    onPick: (preset: LayoutPreset) => void;
}

const NewSlideMenu = ({ presets, isLocked, onPick }: NewSlideMenuProps) => {
    const t = useMessages();

    return (
        <ToolPopover
            label={t.deck.newSlide}
            variant='wide'
            isDisabled={isLocked}
            width={MENU_WIDTH}
            className='vy:aspect-video vy:rounded-lg vy:border vy:border-dashed vy:border-foreground/15 vy:data-hovered:border-foreground/30'
            icon={<Plus className='vy:size-5' />}
        >
            {(close) => (
                <ul className='vy:grid vy:grid-cols-2 vy:gap-1.5'>
                    {presets.map((preset) => (
                        <li key={preset.id}>
                            <button
                                type='button'
                                onClick={() => {
                                    onPick(preset);
                                    close();
                                }}
                                className='vy:flex vy:h-full vy:w-full vy:flex-col vy:items-center vy:gap-1 vy:rounded-lg vy:px-2 vy:py-2.5 vy:text-center vy:text-[0.75rem] vy:text-foreground vy:hover:bg-foreground/[0.05]'
                            >
                                <preset.icon className='vy:size-4 vy:text-muted' aria-hidden='true' />
                                {preset.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </ToolPopover>
    );
};

export default NewSlideMenu;
