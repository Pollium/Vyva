import type { ReactNode } from 'react';

interface PanelRowProps{
    label: string;
    children: ReactNode;
}

const PanelRow = ({ label, children }: PanelRowProps) => (
    <div className='vy:flex vy:min-h-8 vy:items-center vy:justify-between vy:gap-3 vy:text-[0.8125rem]'>
        <span className='vy:text-foreground'>{label}</span>
        <span className='vy:flex vy:items-center vy:gap-0.5'>{children}</span>
    </div>
);

export default PanelRow;
