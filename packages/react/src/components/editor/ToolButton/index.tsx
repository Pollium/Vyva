import { LAYERS } from '../../ui/layers';
import { Button, ToggleButton, Tooltip, TooltipTrigger } from 'react-aria-components';
import type { ReactNode } from 'react';

export type ToolVariant = 'icon' | 'wide' | 'labelled';

const TOOLTIP_DELAY_MS = 400;
const TOOLTIP_OFFSET = 6;

interface ToolButtonProps{
    label: string;
    isActive?: boolean;
    variant?: ToolVariant;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
    children: ReactNode;
}

const BASE = 'vy:inline-flex vy:shrink-0 vy:cursor-default vy:select-none vy:items-center vy:justify-center vy:gap-1.5 vy:rounded-lg vy:text-[0.8125rem] vy:text-foreground vy:outline-none vy:transition-colors vy:data-hovered:bg-foreground/[0.06] vy:data-pressed:bg-foreground/[0.1] vy:data-selected:bg-foreground/[0.1] vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-foreground vy:data-disabled:opacity-35 vy:pointer-coarse:min-h-10 vy:pointer-coarse:min-w-10 vy:motion-reduce:transition-none';

const VARIANTS: Record<ToolVariant, string> = {
    icon: 'vy:size-8',
    wide: 'vy:h-8 vy:w-full vy:px-2',
    labelled: 'vy:h-8 vy:px-2.5'
};

const ToolButton = ({ label, isActive, variant = 'icon', disabled = false, className = '', onClick, children }: ToolButtonProps) => {
    const shared = {
        'aria-label': label,
        isDisabled: disabled,
        preventFocusOnPress: true,
        onPress: onClick,
        className: `${BASE} ${VARIANTS[variant]} ${className}`
    };

    return (
        <TooltipTrigger delay={TOOLTIP_DELAY_MS}>
            {isActive === undefined ? <Button {...shared}>{children}</Button> : <ToggleButton {...shared} isSelected={isActive}>{children}</ToggleButton>}
            <Tooltip offset={TOOLTIP_OFFSET} className={`${LAYERS.popover} vy:rounded-md vy:bg-foreground vy:px-2 vy:py-1 vy:text-[0.75rem] vy:text-background vy:shadow-md`}>{label}</Tooltip>
        </TooltipTrigger>
    );
};

export default ToolButton;
