import type { Inspector, InspectorTab } from '../../../hooks/use-inspector';
import { useMessages } from '../../../messages/context';
import type { LucideIcon } from 'lucide-react';

interface DockButtonProps{
    tab: InspectorTab;
    label: string;
    icon: LucideIcon;
    inspector: Inspector;
    isBusy: boolean;
}

const DockButton = ({ tab, label, icon: Icon, inspector, isBusy }: DockButtonProps) => {
    const t = useMessages();
    const isOn = inspector.isOpen && inspector.tab === tab;

    return (
        <button
            type='button'
            aria-pressed={isOn}
            onClick={() => {
                if(isOn) inspector.close();
                else inspector.show(tab);
            }}
            className={`vy:group vy:flex vy:min-w-0 vy:flex-1 vy:select-none vy:flex-col vy:items-center vy:justify-center vy:gap-0.5 vy:transition-colors vy:focus-visible:outline-2 vy:focus-visible:-outline-offset-2 vy:focus-visible:outline-foreground vy:motion-reduce:transition-none ${isOn ? 'vy:text-foreground' : 'vy:text-muted'}`}
        >
            <span className={`vy:relative vy:flex vy:h-8 vy:w-14 vy:items-center vy:justify-center vy:rounded-full vy:transition-colors vy:motion-reduce:transition-none ${isOn ? 'vy:bg-foreground/[0.08]' : ''}`}>
                <Icon className='vy:size-5 vy:transition-transform vy:duration-150 vy:group-active:scale-90 vy:motion-reduce:transition-none' aria-hidden='true' />
                {isBusy ? <span aria-hidden='true' className='vy:absolute vy:right-3 vy:top-1 vy:size-2 vy:animate-pulse vy:rounded-full vy:bg-accent vy:ring-2 vy:ring-canvas vy:motion-reduce:animate-none' /> : null}
            </span>
            <span className='vy:text-[0.6875rem] vy:leading-none'>{label}</span>
            {isBusy ? <span className='vy:sr-only'>{t.editor.panelBusy}</span> : null}
        </button>
    );
};

export default DockButton;
