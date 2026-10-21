import { Switch } from 'react-aria-components';

interface ToggleFieldProps{
    label: string;
    isSelected: boolean;
    onChange: (isSelected: boolean) => void;
    isDisabled?: boolean;
}

const ToggleField = ({ label, isSelected, onChange, isDisabled }: ToggleFieldProps) => (
    <Switch isSelected={isSelected} onChange={onChange} isDisabled={isDisabled} className='vy:flex vy:w-full vy:cursor-default vy:items-center vy:justify-between vy:gap-6 vy:text-[0.875rem] vy:text-foreground vy:outline-none vy:data-disabled:opacity-50'>
        {({ isFocusVisible }) => (
            <>
                {label}
                <span className={`vy:flex vy:h-5 vy:w-9 vy:shrink-0 vy:items-center vy:rounded-full vy:p-0.5 vy:transition-colors vy:motion-reduce:transition-none ${isSelected ? 'vy:bg-foreground' : 'vy:bg-foreground/20'} ${isFocusVisible ? 'vy:outline-2 vy:outline-offset-2 vy:outline-foreground' : ''}`}>
                    <span className={`vy:size-4 vy:rounded-full vy:bg-background vy:shadow-sm vy:transition-transform vy:motion-reduce:transition-none ${isSelected ? 'vy:translate-x-4' : ''}`} />
                </span>
            </>
        )}
    </Switch>
);

export default ToggleField;
