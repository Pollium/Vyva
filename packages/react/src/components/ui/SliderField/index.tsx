import { Label, Slider, SliderOutput, SliderThumb, SliderTrack } from 'react-aria-components';

const PERCENT = 100;

interface SliderFieldProps{
    label: string;
    value: number;
    minValue: number;
    maxValue: number;
    formatOptions: Intl.NumberFormatOptions;
    onChange: (value: number) => void;
    onChangeEnd?: () => void;
    isDisabled?: boolean;
}

const SliderField = ({ label, value, minValue, maxValue, formatOptions, onChange, onChangeEnd, isDisabled }: SliderFieldProps) => (
    <Slider
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        formatOptions={formatOptions}
        isDisabled={isDisabled}
        className='vy:flex vy:flex-col vy:gap-1 vy:data-disabled:opacity-50'
        onChange={(next) => {
            if(typeof next === 'number') onChange(next);
        }}
        onChangeEnd={onChangeEnd}
    >
        <span className='vy:flex vy:items-center vy:justify-between vy:gap-2'>
            <Label className='vy:text-[0.8125rem] vy:text-muted'>{label}</Label>
            <SliderOutput className='vy:text-[0.8125rem] vy:tabular-nums vy:text-muted' />
        </span>
        <SliderTrack className='vy:relative vy:h-5 vy:w-full'>
            {({ state }) => (
                <>
                    <span className='vy:absolute vy:inset-x-0 vy:top-1/2 vy:h-1 vy:-translate-y-1/2 vy:rounded-full vy:bg-foreground/15' />
                    <span className='vy:absolute vy:left-0 vy:top-1/2 vy:h-1 vy:-translate-y-1/2 vy:rounded-full vy:bg-foreground' style={{ width: `${state.getThumbPercent(0) * PERCENT}%` }} />
                    <SliderThumb className='vy:top-1/2 vy:size-4 vy:rounded-full vy:bg-background vy:shadow vy:ring-1 vy:ring-foreground/25 vy:outline-none vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-offset-2 vy:data-focus-visible:outline-foreground' />
                </>
            )}
        </SliderTrack>
    </Slider>
);

export default SliderField;
