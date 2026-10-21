import FieldLabel from '../FieldLabel';
import { FIELD_BOX } from '../field-box';
import { FieldError, Input, Text, TextArea, TextField } from 'react-aria-components';
import type { Ref } from 'react';

const TEXTAREA_ROWS = 3;

interface TextInputProps{
    label: string;
    value: string;
    onChange: (value: string) => void;
    description?: string;
    placeholder?: string;
    multiline?: boolean;
    maxLength?: number;
    errorMessage?: string;
    isLabelHidden?: boolean;
    autoFocus?: boolean;
    inputRef?: Ref<HTMLInputElement>;
}

const TextInput = ({ label, value, onChange, description, placeholder, multiline = false, maxLength, errorMessage, isLabelHidden = false, autoFocus, inputRef }: TextInputProps) => (
    <TextField
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        isInvalid={errorMessage !== undefined}
        autoFocus={autoFocus}
        validationBehavior='aria'
        className='vy:flex vy:w-full vy:flex-col vy:gap-1.5'
    >
        <FieldLabel isHidden={isLabelHidden}>{label}</FieldLabel>
        {description === undefined ? null : <Text slot='description' className='vy:text-[0.75rem] vy:text-muted'>{description}</Text>}
        {multiline
            ? <TextArea rows={TEXTAREA_ROWS} placeholder={placeholder} className={`${FIELD_BOX} vy:resize-y vy:py-2`} />
            : <Input ref={inputRef} placeholder={placeholder} className={`${FIELD_BOX} vy:h-9`} />}
        <FieldError className='vy:text-[0.75rem] vy:text-danger'>{errorMessage}</FieldError>
    </TextField>
);

export default TextInput;
