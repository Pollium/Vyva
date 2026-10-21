import FieldLabel from '../FieldLabel';
import Popover from '../Popover';
import { FIELD_BOX } from '../field-box';
import { Check, ChevronDown } from 'lucide-react';
import { Button, ListBox, ListBoxItem, Select, SelectValue } from 'react-aria-components';

export interface SelectOption<T extends string>{
    value: T;
    label: string;
    isDisabled?: boolean;
}

interface SelectInputProps<T extends string>{
    label: string;
    value: T;
    options: readonly SelectOption<T>[];
    onChange: (value: T) => void;
    isDisabled?: boolean;
    hideLabel?: boolean;
    className?: string;
}

const SelectInput = <T extends string>({ label, value, options, onChange, isDisabled, hideLabel = false, className = '' }: SelectInputProps<T>) => (
    <Select
        selectedKey={value}
        onSelectionChange={(key) => {
            const next = options.find((option) => option.value === key);
            if(next !== undefined && next.value !== value) onChange(next.value);
        }}
        isDisabled={isDisabled}
        disabledKeys={options.filter((option) => option.isDisabled === true).map((option) => option.value)}
        className={`vy:flex vy:min-w-0 vy:flex-col vy:gap-1.5 ${className}`}
    >
        <FieldLabel isHidden={hideLabel}>{label}</FieldLabel>
        <Button className={`${FIELD_BOX} vy:flex vy:h-9 vy:items-center vy:justify-between vy:gap-2 vy:text-left`}>
            <SelectValue className='vy:min-w-0 vy:truncate' />
            <ChevronDown className='vy:size-4 vy:shrink-0 vy:text-muted' aria-hidden='true' />
        </Button>

        <Popover className='vy:min-w-(--trigger-width)'>
            <ListBox className='vy:max-h-72 vy:overflow-y-auto vy:p-1.5 vy:outline-none'>
                {options.map((option) => (
                    <ListBoxItem
                        key={option.value}
                        id={option.value}
                        textValue={option.label}
                        className='vy:flex vy:cursor-default vy:items-center vy:gap-2 vy:rounded-lg vy:px-2.5 vy:py-1.5 vy:text-[0.8125rem] vy:text-foreground vy:outline-none vy:data-focused:bg-foreground/[0.06] vy:data-disabled:opacity-40'
                    >
                        {({ isSelected }) => (
                            <>
                                <span className='vy:min-w-0 vy:flex-1 vy:truncate'>{option.label}</span>
                                {isSelected ? <Check className='vy:size-3.5 vy:shrink-0' aria-hidden='true' /> : null}
                            </>
                        )}
                    </ListBoxItem>
                ))}
            </ListBox>
        </Popover>
    </Select>
);

export default SelectInput;
