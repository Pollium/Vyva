import PanelDisclosure from '../../editor/PanelDisclosure';
import PanelRow from '../../editor/PanelRow';
import ColorInput from '../../ui/ColorInput';
import NumberInput from '../../ui/NumberInput';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { FONT_FAMILIES, type DocumentDesign } from '@vyva/core/content';

const MIN_BASE_SIZE = 8;
const MAX_BASE_SIZE = 24;
const FONT_OPTIONS = FONT_FAMILIES.map((font) => ({ value: font, label: font }));

interface TextSettingsProps{
    design: DocumentDesign;
    onChange: (design: DocumentDesign) => void;
}

const TextSettings = ({ design, onChange }: TextSettingsProps) => {
    const t = useMessages();

    return (
        <PanelDisclosure title={t.document.text} summary={`${design.font} · ${design.baseSize} pt`}>
            <PanelRow label={t.document.font}>
                <SelectInput label={t.document.font} hideLabel className='vy:w-40' value={design.font} options={FONT_OPTIONS} onChange={(font) => onChange({ ...design, font })} />
            </PanelRow>
            <NumberInput label={t.document.baseSize} value={design.baseSize} minValue={MIN_BASE_SIZE} maxValue={MAX_BASE_SIZE} onChange={(baseSize) => onChange({ ...design, baseSize })} />
            <div className='vy:grid vy:grid-cols-2 vy:gap-x-3 vy:gap-y-2'>
                <ColorInput label={t.document.textColorShort} value={design.textColor} onChange={(textColor) => onChange({ ...design, textColor })} />
                <ColorInput label={t.document.accent} value={design.accentColor} onChange={(accentColor) => onChange({ ...design, accentColor })} />
            </div>
        </PanelDisclosure>
    );
};

export default TextSettings;
