import ToolButton, { type ToolVariant } from '../ToolButton';
import Popover from '../../ui/Popover';
import { useState, type ReactNode } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components';

const DEFAULT_WIDTH = 224;

interface ToolPopoverProps{
    label: string;
    icon: ReactNode;
    isActive?: boolean;
    isDisabled?: boolean;
    variant?: ToolVariant;
    width?: number;
    className?: string;
    onOpen?: () => void;
    onClosed?: () => void;
    children: (close: () => void) => ReactNode;
}

const ToolPopover = ({ label, icon, isActive, isDisabled = false, variant = 'icon', width = DEFAULT_WIDTH, className, onOpen, onClosed, children }: ToolPopoverProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const setOpen = (next: boolean) => {
        if(next) onOpen?.();
        setIsOpen(next);
        if(!next) onClosed?.();
    };

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
            <ToolButton label={label} variant={variant} isActive={isActive} disabled={isDisabled} className={className}>
                {icon}
            </ToolButton>

            <Popover placement='bottom start' style={{ width }}>
                <Dialog aria-label={label} className='vy:p-3 vy:outline-none'>
                    {children(() => setOpen(false))}
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
};

export default ToolPopover;
