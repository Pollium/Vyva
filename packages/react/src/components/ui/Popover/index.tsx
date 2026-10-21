import { LAYERS } from '../layers';
import { Popover as AriaPopover, type PopoverProps as AriaPopoverProps } from 'react-aria-components';

const OFFSET = 6;

interface PopoverProps extends Omit<AriaPopoverProps, 'className'>{
    className?: string;
}

const Popover = ({ className = '', ...props }: PopoverProps) => (
    <AriaPopover offset={OFFSET} {...props} className={`${LAYERS.popover} vy:rounded-2xl vy:bg-background vy:text-foreground vy:shadow-lg vy:ring-1 vy:ring-foreground/10 vy:outline-none ${className}`} />
);

export default Popover;
