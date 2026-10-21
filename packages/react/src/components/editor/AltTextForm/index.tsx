import Button from '../../ui/Button';
import TextInput from '../../ui/TextInput';
import { useMessages } from '../../../messages/context';
import { useState } from 'react';

const MAX_ALT_TEXT = 300;

interface AltTextFormProps{
    value: string;
    onApply: (alt: string) => void;
}

const AltTextForm = ({ value, onApply }: AltTextFormProps) => {
    const t = useMessages();
    const [draft, setDraft] = useState(value);

    return (
        <form
            className='vy:flex vy:flex-col vy:gap-2'
            onSubmit={(event) => {
                event.preventDefault();
                onApply(draft.trim().slice(0, MAX_ALT_TEXT));
            }}
        >
            <TextInput
                label={t.editor.altText}
                description={t.editor.altTextHint}
                multiline
                autoFocus
                value={draft}
                maxLength={MAX_ALT_TEXT}
                placeholder={t.editor.altTextPlaceholder}
                onChange={setDraft}
            />
            <Button type='submit' size='sm' className='vy:self-end'>{t.editor.apply}</Button>
        </form>
    );
};

export default AltTextForm;
