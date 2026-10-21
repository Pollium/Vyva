import NumberInput from '../../ui/NumberInput';
import { useMessages } from '../../../messages/context';
import { MIN_SIZE } from '../../../utils/deck/geometry';
import type { SlideElement } from '@vyva/core/content';

type FrameKey = 'x' | 'y' | 'w' | 'h' | 'rotation';

const MAX_OFFSET = 10000;
const FULL_TURN = 360;

const FIELDS: Array<{ key: FrameKey; min: number; max: number }> = [
    { key: 'x', min: -MAX_OFFSET, max: MAX_OFFSET },
    { key: 'y', min: -MAX_OFFSET, max: MAX_OFFSET },
    { key: 'w', min: MIN_SIZE, max: MAX_OFFSET },
    { key: 'h', min: MIN_SIZE, max: MAX_OFFSET },
    { key: 'rotation', min: -FULL_TURN, max: FULL_TURN }
];

interface FrameFieldsProps{
    element: SlideElement;
    isLocked: boolean;
    onChange: (key: FrameKey, value: number) => void;
}

const FrameFields = ({ element, isLocked, onChange }: FrameFieldsProps) => {
    const t = useMessages();

    return (
        <div className='vy:grid vy:grid-cols-2 vy:gap-2'>
            {FIELDS.filter(({ key }) => key !== 'h' || element.type !== 'text').map(({ key, min, max }) => (
                <NumberInput
                    key={key}
                    label={t.deck.frame[key]}
                    value={Math.round(element[key])}
                    minValue={min}
                    maxValue={max}
                    isDisabled={isLocked || element.isLocked}
                    onChange={(value) => onChange(key, value)}
                />
            ))}
        </div>
    );
};

export default FrameFields;
