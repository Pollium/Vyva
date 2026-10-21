import HeaderSettings from '../HeaderSettings';
import PageSettings from '../PageSettings';
import TextSettings from '../TextSettings';
import type { ImagePicker, PickedImage } from '../../../contracts/images';
import type { DocumentDesign } from '@vyva/core/content';
import { useEffect, useRef, useState } from 'react';

export type DesignField = 'header' | 'footer';

interface DesignPanelProps{
    design: DocumentDesign;
    logoUrl: string | null;
    isLocked: boolean;
    focusField: { field: DesignField } | null;
    imagePicker: ImagePicker | undefined;
    onChange: (design: DocumentDesign) => void;
    onLogo: (image: PickedImage | null) => void;
}

const DesignPanel = ({ design, logoUrl, isLocked, focusField, imagePicker, onChange, onLogo }: DesignPanelProps) => {
    const [isHeaderOpen, setHeaderOpen] = useState(false);
    const [shownFocus, setShownFocus] = useState(focusField);
    const header = useRef<HTMLInputElement | null>(null);
    const footer = useRef<HTMLInputElement | null>(null);

    if(focusField !== shownFocus){
        setShownFocus(focusField);
        if(focusField !== null) setHeaderOpen(true);
    }

    useEffect(() => {
        const field = focusField?.field === 'header' ? header.current : focusField?.field === 'footer' ? footer.current : null;
        field?.scrollIntoView({ block: 'center' });
        field?.focus();
    }, [focusField]);

    return (
        <fieldset disabled={isLocked} className='vy:flex vy:min-w-0 vy:flex-col vy:disabled:opacity-60'>
            <PageSettings design={design} onChange={onChange} />
            <TextSettings design={design} onChange={onChange} />
            <HeaderSettings
                design={design}
                logoUrl={logoUrl}
                isExpanded={isHeaderOpen}
                headerRef={header}
                footerRef={footer}
                imagePicker={imagePicker}
                onExpandedChange={setHeaderOpen}
                onChange={onChange}
                onLogo={onLogo}
            />
        </fieldset>
    );
};

export default DesignPanel;
