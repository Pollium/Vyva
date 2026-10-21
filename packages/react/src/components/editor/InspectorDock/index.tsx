import DockButton from '../DockButton';
import type { InspectorPanel } from '../../../contracts/inspector-panel';
import type { Inspector } from '../../../hooks/use-inspector';
import { useMessages } from '../../../messages/context';
import { SlidersHorizontal } from 'lucide-react';

interface InspectorDockProps{
    inspector: Inspector;
    panel: InspectorPanel | undefined;
}

const InspectorDock = ({ inspector, panel }: InspectorDockProps) => {
    const t = useMessages();

    return (
        <nav aria-label={t.editor.panels} className='vy-safe-bottom vy:order-last vy:shrink-0 vy:border-t vy:border-foreground/[0.06] vy:bg-canvas vy:max-lg:landscape:col-span-2 vy:lg:hidden'>
            <div className='vy:flex vy:h-14 vy:items-stretch vy:px-2'>
                <DockButton tab='properties' label={t.editor.properties} icon={SlidersHorizontal} inspector={inspector} isBusy={false} />
                {panel === undefined ? null : <DockButton tab='panel' label={panel.label} icon={panel.icon} inspector={inspector} isBusy={panel.isBusy} />}
            </div>
        </nav>
    );
};

export default InspectorDock;
