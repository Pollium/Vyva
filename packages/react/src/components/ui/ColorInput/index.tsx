import FieldLabel from '../FieldLabel';
import Popover from '../Popover';
import { FIELD_BOX } from '../field-box';
import { useMessages } from '../../../messages/context';
import { Button, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch, ColorThumb, Dialog, DialogTrigger, Input, SliderTrack } from 'react-aria-components';

interface ColorInputProps{
    label: string;
    value: string;
    onChange: (color: string) => void;
    onChangeEnd?: () => void;
}

const THUMB = 'vy:size-5 vy:rounded-full vy:border-2 vy:border-white vy:shadow vy:ring-1 vy:ring-black/30 vy:data-focus-visible:size-6';

const ColorInput = ({ label, value, onChange, onChangeEnd }: ColorInputProps) => {
    const t = useMessages();

    return (
        <ColorPicker value={value} onChange={(color) => onChange(color.toString('hex').toLowerCase())}>
            <DialogTrigger>
                <Button className='vy:flex vy:min-w-0 vy:items-center vy:gap-2 vy:rounded-lg vy:p-1 vy:text-left vy:outline-none vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-foreground vy:data-hovered:bg-foreground/[0.05]'>
                    <ColorSwatch className='vy:size-6 vy:shrink-0 vy:rounded-md vy:ring-1 vy:ring-foreground/15' />
                    <span className='vy:min-w-0 vy:truncate vy:text-[0.8125rem] vy:text-foreground'>{label}</span>
                </Button>

                <Popover placement='bottom start' className='vy:w-60 vy:p-3'>
                    <Dialog aria-label={label} className='vy:flex vy:flex-col vy:gap-3 vy:outline-none'>
                        <ColorArea aria-label={label} colorSpace='hsb' xChannel='saturation' yChannel='brightness' onChangeEnd={onChangeEnd} className='vy:aspect-square vy:w-full vy:rounded-lg'>
                            <ColorThumb className={THUMB} />
                        </ColorArea>
                        <ColorSlider aria-label={t.ui.hue} colorSpace='hsb' channel='hue' onChangeEnd={onChangeEnd}>
                            <SliderTrack className='vy:h-5 vy:w-full vy:rounded-full'>
                                <ColorThumb className={`${THUMB} vy:top-1/2`} />
                            </SliderTrack>
                        </ColorSlider>
                        <ColorField onBlur={onChangeEnd} className='vy:flex vy:flex-col vy:gap-1.5'>
                            <FieldLabel isHidden>{t.ui.hexCode}</FieldLabel>
                            <Input className={`${FIELD_BOX} vy:h-8 vy:font-mono vy:text-[0.8125rem]`} />
                        </ColorField>
                    </Dialog>
                </Popover>
            </DialogTrigger>
        </ColorPicker>
    );
};

export default ColorInput;
