import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface InspectorPanel{
    label: string;
    icon: LucideIcon;
    isBusy: boolean;
    actions?: ReactNode;
    content: ReactNode;
}
