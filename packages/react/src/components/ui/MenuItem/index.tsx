import { MenuItem as AriaMenuItem, type MenuItemProps as AriaMenuItemProps } from 'react-aria-components';

interface MenuItemProps extends Omit<AriaMenuItemProps, 'className'>{
    isDanger?: boolean;
}

const MenuItem = ({ isDanger = false, ...props }: MenuItemProps) => (
    <AriaMenuItem
        {...props}
        className={`vy:flex vy:cursor-default vy:items-center vy:gap-2.5 vy:rounded-lg vy:px-2.5 vy:py-1.5 vy:text-[0.8125rem] vy:outline-none vy:data-focused:bg-foreground/[0.06] vy:data-disabled:opacity-40 ${isDanger ? 'vy:text-danger' : 'vy:text-foreground'}`}
    />
);

export default MenuItem;
