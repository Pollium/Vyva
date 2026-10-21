import { Check } from 'lucide-react';
import { Checkbox } from 'react-aria-components';

interface CheckboxFieldProps{
    label: string;
    isSelected: boolean;
    onChange: (isSelected: boolean) => void;
}

const CheckboxField = ({ label, isSelected, onChange }: CheckboxFieldProps) => (
    <Checkbox isSelected={isSelected} onChange={onChange} className='vy:flex vy:cursor-default vy:items-start vy:gap-2 vy:text-[0.8125rem] vy:text-foreground vy:outline-none vy:data-disabled:opacity-50'>
        {({ isFocusVisible }) => (
            <>
                <span className={`vy:mt-px vy:grid vy:size-4 vy:shrink-0 vy:place-items-center vy:rounded-[5px] vy:border vy:transition-colors vy:motion-reduce:transition-none ${isSelected ? 'vy:border-foreground vy:bg-foreground vy:text-background' : 'vy:border-foreground/30'} ${isFocusVisible ? 'vy:outline-2 vy:outline-offset-2 vy:outline-foreground' : ''}`}>
                    {isSelected ? <Check className='vy:size-3' strokeWidth={3} aria-hidden='true' /> : null}
                </span>
                {label}
            </>
        )}
    </Checkbox>
);

export default CheckboxField;
