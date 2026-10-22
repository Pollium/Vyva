import type { Messages } from '../../messages/en';
import type { SlideSpec } from '@pollium/vyva-core/slide-layouts';
import { Columns2, Hash, Heading1, Image, LayoutTemplate, List, PanelLeft, PanelRight, Quote, Square, Table2, Type, type LucideIcon } from 'lucide-react';

export const LAYOUT_PRESET_IDS = ['title', 'section', 'bullets', 'two-columns', 'image-left', 'image-right', 'image-full', 'quote', 'table', 'big-number', 'closing', 'blank'] as const;

export type LayoutPresetId = typeof LAYOUT_PRESET_IDS[number];

export interface LayoutPreset{
    id: LayoutPresetId;
    label: string;
    icon: LucideIcon;
    needsImage: boolean;
    spec: SlideSpec | null;
}

const ICONS: Record<LayoutPresetId, LucideIcon> = {
    title: Heading1,
    section: LayoutTemplate,
    bullets: List,
    'two-columns': Columns2,
    'image-left': PanelLeft,
    'image-right': PanelRight,
    'image-full': Image,
    quote: Quote,
    table: Table2,
    'big-number': Hash,
    closing: Type,
    blank: Square
};

const NEEDS_IMAGE: readonly LayoutPresetId[] = ['image-left', 'image-right', 'image-full'];

export const layoutPresetsOf = (t: Messages): LayoutPreset[] => LAYOUT_PRESET_IDS.map((id) => ({
    id,
    label: t.deck.layouts[id],
    icon: ICONS[id],
    needsImage: NEEDS_IMAGE.includes(id),
    spec: id === 'blank' ? null : { layout: id, ...t.deck.layoutSamples[id] }
}));
