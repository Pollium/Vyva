import type { ReactNode } from 'react';

interface PanelSectionProps{
    title: string;
    children: ReactNode;
}

const PanelSection = ({ title, children }: PanelSectionProps) => (
    <section className='vy:flex vy:flex-col vy:gap-2.5 vy:py-3'>
        <h3 className='vy:text-[0.8125rem] vy:font-medium vy:text-muted'>{title}</h3>
        {children}
    </section>
);

export default PanelSection;
