import FieldLabel from '../FieldLabel';
import { FIELD_BOX } from '../field-box';
import { Minus, Plus } from 'lucide-react';
import { Button, Group, Input, NumberField } from 'react-aria-components';

interface NumberInputProps{
    label: string;
    value: number;
    minValue: number;
    maxValue: number;
    onChange: (value: number) => void;
    isDisabled?: boolean;
}

const STEP_BUTTON = 'vy:grid vy:size-7 vy:shrink-0 vy:place-items-center vy:rounded-lg vy:text-muted vy:outline-none vy:data-hovered:bg-foreground/[0.06] vy:data-hovered:text-foreground vy:data-disabled:opacity-40';

const NumberInput = ({ label, value, minValue, maxValue, onChange, isDisabled }: NumberInputProps) => (
    <NumberField
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        step={1}
        isDisabled={isDisabled}
        className='vy:flex vy:w-full vy:flex-col vy:gap-1.5'
        onChange={(next) => {
            if(Number.isFinite(next) && next !== value) onChange(Math.round(next));
        }}
    >
        <FieldLabel>{label}</FieldLabel>
        <Group className={`${FIELD_BOX} vy:flex vy:h-9 vy:items-center vy:gap-1 vy:px-1`}>
            <Button slot='decrement' className={STEP_BUTTON}>
                <Minus className='vy:size-3.5' aria-hidden='true' />
            </Button>
            <Input className='vy:min-w-0 vy:flex-1 vy:bg-transparent vy:text-center vy:tabular-nums vy:outline-none' />
            <Button slot='increment' className={STEP_BUTTON}>
                <Plus className='vy:size-3.5' aria-hidden='true' />
            </Button>
        </Group>
    </NumberField>
);

export default NumberInput;
