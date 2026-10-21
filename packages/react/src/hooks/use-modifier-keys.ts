import { useEffect, useState } from 'react';

export interface Modifiers{
    shift: boolean;
    alt: boolean;
}

const RELEASED: Modifiers = { shift: false, alt: false };

export const useModifierKeys = (): Modifiers => {
    const [modifiers, setModifiers] = useState<Modifiers>(RELEASED);

    useEffect(() => {
        const track = (event: KeyboardEvent) => setModifiers((current) => current.shift === event.shiftKey && current.alt === event.altKey ? current : { shift: event.shiftKey, alt: event.altKey });
        const reset = () => setModifiers(RELEASED);
        window.addEventListener('keydown', track);
        window.addEventListener('keyup', track);
        window.addEventListener('blur', reset);

        return () => {
            window.removeEventListener('keydown', track);
            window.removeEventListener('keyup', track);
            window.removeEventListener('blur', reset);
        };
    }, []);

    return modifiers;
};
