import Modal from '../../ui/Modal';
import { useMessages } from '../../../messages/context';
import type { LayoutPreset } from '../../../utils/deck/layout-presets';

interface LayoutPickerProps{
    presets: LayoutPreset[];
    slideNumber: number;
    onPick: (preset: LayoutPreset) => void;
    onClose: () => void;
}

const LayoutPicker = ({ presets, slideNumber, onPick, onClose }: LayoutPickerProps) => {
    const t = useMessages();

    return (
        <Modal isOpen onOpenChange={(isOpen) => { if(!isOpen) onClose(); }} title={t.deck.changeLayoutOf(slideNumber)}>
            <div className='vy:flex vy:flex-col vy:gap-3'>
                <p className='vy:text-[0.875rem] vy:text-muted'>{t.deck.relayoutHint}</p>
                <ul className='vy:grid vy:grid-cols-2 vy:gap-2 vy:sm:grid-cols-3'>
                    {presets.filter((preset) => preset.spec !== null).map((preset) => (
                        <li key={preset.id}>
                            <button
                                type='button'
                                onClick={() => onPick(preset)}
                                className='vy:flex vy:h-full vy:w-full vy:flex-col vy:items-center vy:gap-1.5 vy:rounded-xl vy:border vy:border-foreground/10 vy:px-2 vy:py-3 vy:text-center vy:text-[0.8125rem] vy:text-foreground vy:transition-colors vy:hover:bg-foreground/[0.05] vy:focus-visible:outline-2 vy:focus-visible:outline-foreground vy:motion-reduce:transition-none'
                            >
                                <preset.icon className='vy:size-5 vy:text-muted' aria-hidden='true' />
                                {preset.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
};

export default LayoutPicker;
