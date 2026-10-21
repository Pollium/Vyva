import type { ReactNode } from 'react';

interface MenuRowProps{
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}

const MenuRow = ({ disabled = false, onClick, children }: MenuRowProps) => (
    <button
        type='button'
        disabled={disabled}
        onClick={onClick}
        className='vy:flex vy:w-full vy:items-center vy:gap-2.5 vy:rounded-lg vy:px-2.5 vy:py-1.5 vy:text-left vy:text-[0.8125rem] vy:text-foreground vy:hover:bg-foreground/[0.06] vy:disabled:opacity-40'
    >
        {children}
    </button>
);

export default MenuRow;
