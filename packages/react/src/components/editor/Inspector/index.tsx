import InspectorDock from '../InspectorDock';
import Button from '../../ui/Button';
import { LAYERS } from '../../ui/layers';
import type { InspectorPanel } from '../../../contracts/inspector-panel';
import type { Inspector as InspectorState } from '../../../hooks/use-inspector';
import { useMessages } from '../../../messages/context';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs, type Key } from 'react-aria-components';

interface InspectorProps{
    inspector: InspectorState;
    properties: ReactNode;
    panel: InspectorPanel | undefined;
}

const TAB = 'vy:flex vy:cursor-default vy:items-center vy:gap-1.5 vy:rounded-full vy:px-3 vy:py-1.5 vy:text-[0.8125rem] vy:font-medium vy:text-muted vy:outline-none vy:transition-colors vy:data-hovered:text-foreground vy:data-selected:bg-foreground/[0.07] vy:data-selected:text-foreground vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-foreground vy:motion-reduce:transition-none';

const Inspector = ({ inspector, properties, panel }: InspectorProps) => {
    const t = useMessages();

    return (
        <>
            <aside
                aria-label={t.editor.sidePanel}
                data-state={inspector.isOpen ? 'open' : 'closed'}
                onKeyDown={(event) => {
                    if(event.key === 'Escape') inspector.close();
                }}
                className={`vy-sheet vy:fixed vy:inset-x-0 vy:bottom-0 ${LAYERS.sheet} vy:flex vy:flex-col vy:overflow-hidden vy:rounded-t-3xl vy:bg-canvas vy:shadow-[0_-12px_40px_rgba(0,0,0,0.14)] vy:ring-1 vy:ring-foreground/[0.06] vy:sm:bottom-3 vy:sm:left-auto vy:sm:right-[max(0.75rem,env(safe-area-inset-right))] vy:sm:top-[calc(env(safe-area-inset-top)+4.5rem)] vy:sm:h-auto vy:sm:w-[22rem] vy:sm:rounded-3xl vy:lg:static vy:lg:z-auto vy:lg:h-auto vy:lg:w-72 vy:lg:shrink-0 vy:lg:rounded-3xl vy:lg:bg-surface vy:lg:shadow-none vy:lg:ring-0 vy:xl:w-80 ${inspector.tab === 'panel' ? 'vy:h-[88dvh]' : 'vy:h-[55dvh]'}`}
            >
                <button type='button' aria-label={t.editor.closePanel} onClick={inspector.close} className='vy:flex vy:h-5 vy:shrink-0 vy:items-end vy:justify-center vy:lg:hidden'>
                    <span aria-hidden='true' className='vy:h-1.5 vy:w-10 vy:rounded-full vy:bg-foreground/20' />
                </button>
                <Tabs selectedKey={inspector.tab} onSelectionChange={(key: Key) => inspector.show(key === 'panel' ? 'panel' : 'properties')} className='vy:flex vy:min-h-0 vy:flex-1 vy:flex-col'>
                    <div className='vy:flex vy:shrink-0 vy:items-center vy:gap-2 vy:px-3 vy:pb-1 vy:pt-2 vy:lg:pt-3'>
                        <TabList aria-label={t.editor.sidePanel} className='vy:flex vy:flex-1 vy:items-center vy:gap-1'>
                            <Tab id='properties' className={TAB}>{t.editor.properties}</Tab>
                            {panel === undefined ? null : (
                                <Tab id='panel' className={TAB}>
                                    <panel.icon className='vy:size-3.5' aria-hidden='true' />
                                    {panel.label}
                                    {panel.isBusy ? (
                                        <>
                                            <span aria-hidden='true' className='vy:size-1.5 vy:animate-pulse vy:rounded-full vy:bg-current vy:motion-reduce:animate-none' />
                                            <span className='vy:sr-only'>{t.editor.panelBusy}</span>
                                        </>
                                    ) : null}
                                </Tab>
                            )}
                        </TabList>
                        {inspector.tab === 'panel' ? panel?.actions : null}
                        <Button isIconOnly size='sm' variant='ghost' aria-label={t.editor.closePanel} onPress={inspector.close} className='vy:lg:hidden'>
                            <X className='vy:size-4' aria-hidden='true' />
                        </Button>
                    </div>
                    <TabPanel id='properties' className='vy:min-h-0 vy:flex-1 vy:overflow-y-auto vy:overscroll-contain vy:px-4 vy:pb-4 vy:outline-none'>
                        {properties}
                    </TabPanel>
                    {panel === undefined ? null : (
                        <TabPanel id='panel' shouldForceMount className='vy:flex vy:min-h-0 vy:flex-1 vy:flex-col vy:outline-none vy:[&[inert]]:hidden'>
                            {panel.content}
                        </TabPanel>
                    )}
                </Tabs>
            </aside>

            <InspectorDock inspector={inspector} panel={panel} />
        </>
    );
};

export default Inspector;
