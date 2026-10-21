import PanelDisclosure from '../../editor/PanelDisclosure';
import PanelRow from '../../editor/PanelRow';
import NumberInput from '../../ui/NumberInput';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import type { DocumentDesign, PageMargins } from '@vyva/core/content';
import { useState } from 'react';

const PRESETS = ['narrow', 'normal', 'wide'] as const;
const MARGIN_OPTIONS = [...PRESETS, 'custom'] as const;
const SIDES = ['top', 'bottom', 'left', 'right'] as const;
const MAX_MARGIN_MM = 60;

type MarginPreset = typeof MARGIN_OPTIONS[number];

const MARGIN_PRESETS: Record<typeof PRESETS[number], PageMargins> = {
    narrow: { top: 12, right: 12, bottom: 12, left: 12 },
    normal: { top: 20, right: 20, bottom: 20, left: 20 },
    wide: { top: 20, right: 32, bottom: 20, left: 32 }
};

const presetOf = (margins: PageMargins): MarginPreset => PRESETS.find((preset) => SIDES.every((side) => MARGIN_PRESETS[preset][side] === margins[side])) ?? 'custom';

interface PageSettingsProps{
    design: DocumentDesign;
    onChange: (design: DocumentDesign) => void;
}

const PageSettings = ({ design, onChange }: PageSettingsProps) => {
    const t = useMessages();
    const [isCustom, setCustom] = useState(() => presetOf(design.margins) === 'custom');
    const preset = isCustom ? 'custom' : presetOf(design.margins);

    return (
        <PanelDisclosure title={t.document.page} summary={t.document.marginsSummary(t.document.marginPresets[preset])}>
            <PanelRow label={t.document.margins}>
                <SelectInput
                    label={t.document.margins}
                    hideLabel
                    className='vy:w-40'
                    value={preset}
                    options={MARGIN_OPTIONS.map((option) => ({ value: option, label: t.document.marginPresets[option] }))}
                    onChange={(next) => {
                        setCustom(next === 'custom');
                        if(next !== 'custom') onChange({ ...design, margins: MARGIN_PRESETS[next] });
                    }}
                />
            </PanelRow>
            {preset === 'custom' ? (
                <div className='vy:grid vy:grid-cols-2 vy:gap-3'>
                    {SIDES.map((side) => (
                        <NumberInput
                            key={side}
                            label={t.document.marginSide(t.document.marginSides[side])}
                            value={design.margins[side]}
                            minValue={0}
                            maxValue={MAX_MARGIN_MM}
                            onChange={(margin) => onChange({ ...design, margins: { ...design.margins, [side]: margin } })}
                        />
                    ))}
                </div>
            ) : null}
        </PanelDisclosure>
    );
};

export default PageSettings;
