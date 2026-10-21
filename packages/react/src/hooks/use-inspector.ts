import { useState } from 'react';

export type InspectorTab = 'properties' | 'panel';

export interface Inspector{
    tab: InspectorTab;
    isOpen: boolean;
    show: (tab: InspectorTab) => void;
    close: () => void;
}

export const useInspector = (): Inspector => {
    const [tab, setTab] = useState<InspectorTab>('properties');
    const [isOpen, setOpen] = useState(false);

    return {
        tab,
        isOpen,
        show: (next) => {
            setTab(next);
            setOpen(true);
        },
        close: () => setOpen(false)
    };
};
