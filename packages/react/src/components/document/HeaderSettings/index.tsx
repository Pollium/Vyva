import PanelDisclosure from '../../editor/PanelDisclosure';
import PanelRow from '../../editor/PanelRow';
import Button from '../../ui/Button';
import CheckboxField from '../../ui/CheckboxField';
import TextInput from '../../ui/TextInput';
import type { ImagePicker, PickedImage } from '../../../contracts/images';
import { useMessages } from '../../../messages/context';
import type { DocumentDesign } from '@pollium/vyva-core/content';
import { ImagePlus } from 'lucide-react';
import { useState, type RefObject } from 'react';

const MAX_SLOT_TEXT = 200;

interface HeaderSettingsProps{
    design: DocumentDesign;
    logoUrl: string | null;
    isExpanded: boolean;
    headerRef: RefObject<HTMLInputElement | null>;
    footerRef: RefObject<HTMLInputElement | null>;
    imagePicker: ImagePicker | undefined;
    onExpandedChange: (isExpanded: boolean) => void;
    onChange: (design: DocumentDesign) => void;
    onLogo: (image: PickedImage | null) => void;
}

const HeaderSettings = ({ design, logoUrl, isExpanded, headerRef, footerRef, imagePicker: Picker, onExpandedChange, onChange, onLogo }: HeaderSettingsProps) => {
    const t = useMessages();
    const [isPickingLogo, setPickingLogo] = useState(false);
    const isEmpty = design.headerText.trim() === '' && design.footerText.trim() === '' && design.headerLogoFileId === null;

    return (
        <PanelDisclosure title={t.document.headerAndFooter} summary={isEmpty ? t.document.noHeader : undefined} isExpanded={isExpanded} onExpandedChange={onExpandedChange}>
            <TextInput inputRef={headerRef} label={t.document.header} value={design.headerText} maxLength={MAX_SLOT_TEXT} placeholder={t.document.headerPlaceholder} onChange={(headerText) => onChange({ ...design, headerText })} />
            <PanelRow label={t.document.logo}>
                {design.headerLogoFileId === null || logoUrl === null ? (
                    Picker === undefined ? null : (
                        <Button size='sm' variant='ghost' onPress={() => setPickingLogo(true)}>
                            <ImagePlus className='vy:size-4' aria-hidden='true' />
                            {t.document.choose}
                        </Button>
                    )
                ) : (
                    <>
                        <img src={logoUrl} alt={t.document.headerLogo} className='vy:h-8 vy:max-w-24 vy:rounded vy:border vy:border-foreground/10 vy:bg-white vy:object-contain vy:p-0.5' />
                        <Button size='sm' variant='ghost' onPress={() => onLogo(null)}>{t.document.remove}</Button>
                    </>
                )}
            </PanelRow>
            <TextInput inputRef={footerRef} label={t.document.footer} value={design.footerText} maxLength={MAX_SLOT_TEXT} placeholder={t.document.footerPlaceholder} onChange={(footerText) => onChange({ ...design, footerText })} />
            <CheckboxField label={t.document.numberPages} isSelected={design.showPageNumbers} onChange={(showPageNumbers) => onChange({ ...design, showPageNumbers })} />

            {Picker === undefined || !isPickingLogo ? null : <Picker isOpen onOpenChange={setPickingLogo} onPick={onLogo} />}
        </PanelDisclosure>
    );
};

export default HeaderSettings;
