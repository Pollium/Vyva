import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends Omit<AriaButtonProps, 'className'>{
    variant?: ButtonVariant;
    size?: ButtonSize;
    isIconOnly?: boolean;
    className?: string;
}

const BASE = 'vy:inline-flex vy:shrink-0 vy:cursor-default vy:select-none vy:items-center vy:justify-center vy:gap-2 vy:rounded-full vy:font-medium vy:outline-none vy:transition-colors vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-offset-2 vy:data-focus-visible:outline-foreground vy:data-disabled:opacity-40 vy:data-pending:opacity-70 vy:motion-reduce:transition-none';

const VARIANTS: Record<ButtonVariant, string> = {
    primary: 'vy:bg-foreground vy:text-background vy:data-hovered:bg-foreground/85',
    secondary: 'vy:bg-foreground/[0.07] vy:text-foreground vy:data-hovered:bg-foreground/[0.11]',
    tertiary: 'vy:text-foreground vy:data-hovered:bg-foreground/[0.06]',
    ghost: 'vy:text-muted vy:data-hovered:bg-foreground/[0.06] vy:data-hovered:text-foreground',
    danger: 'vy:bg-danger vy:text-white vy:data-hovered:bg-danger/85'
};

const SIZES: Record<ButtonSize, string> = {
    sm: 'vy:h-8 vy:px-3 vy:text-[0.8125rem]',
    md: 'vy:h-10 vy:px-4 vy:text-[0.875rem]'
};

const ICON_SIZES: Record<ButtonSize, string> = {
    sm: 'vy:size-8',
    md: 'vy:size-10'
};

const Button = ({ variant = 'primary', size = 'md', isIconOnly = false, className = '', ...props }: ButtonProps) => (
    <AriaButton {...props} className={`${BASE} ${VARIANTS[variant]} ${isIconOnly ? ICON_SIZES[size] : SIZES[size]} ${className}`} />
);

export default Button;
