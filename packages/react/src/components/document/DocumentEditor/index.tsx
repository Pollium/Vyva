import BlockPanel from '../BlockPanel';
import DesignPanel, { type DesignField } from '../DesignPanel';
import DocumentOutline from '../DocumentOutline';
import DocumentPage from '../DocumentPage';
import DocumentToolbar from '../DocumentToolbar';
import SelectionActions from '../SelectionActions';
import Inspector from '../../editor/Inspector';
import type { EditorSession } from '../../../contracts/editor-session';
import type { ImagePicker } from '../../../contracts/images';
import type { InspectorPanel } from '../../../contracts/inspector-panel';
import type { SelectionAction } from '../../../contracts/selection-action';
import { useDocumentEditor } from '../../../hooks/use-document-editor';
import { useInspector } from '../../../hooks/use-inspector';
import { useMessages } from '../../../messages/context';
import { CONTENT_CSS, type FileUrl } from '@pollium/vyva-core/render';
import { useImperativeHandle, useState, type Ref } from 'react';

export interface DocumentEditorHandle{
    showPanel: () => void;
}

interface DocumentEditorProps{
    session: EditorSession;
    readOnly: boolean;
    fileUrl: FileUrl;
    imagePicker?: ImagePicker;
    panel?: InspectorPanel;
    onSelectionAction?: (action: SelectionAction, text: string) => void;
    ref?: Ref<DocumentEditorHandle>;
}

const DocumentEditor = ({ session, readOnly, fileUrl, imagePicker: Picker, panel, onSelectionAction, ref }: DocumentEditorProps) => {
    const t = useMessages();
    const { editor, design, fileUrl: resolve, changeDesign, insertImage, setLogo } = useDocumentEditor({ session, readOnly, hostFileUrl: fileUrl, placeholder: t.document.placeholder, label: t.document.content });
    const inspector = useInspector();
    const [designField, setDesignField] = useState<{ field: DesignField } | null>(null);
    const [isPickingImage, setPickingImage] = useState(false);
    const logoUrl = design.headerLogoFileId === null ? null : resolve(design.headerLogoFileId);

    useImperativeHandle(ref, () => ({ showPanel: () => inspector.show('panel') }));

    const openDesign = (field: DesignField) => {
        setDesignField({ field });
        inspector.show('properties');
    };

    return (
        <div className='vy-ui vy:flex vy:h-full vy:min-h-0 vy:min-w-0 vy:flex-1 vy:flex-col vy:bg-foreground/[0.03] vy:text-foreground vy:lg:flex-row vy:lg:gap-3 vy:lg:p-3'>
            <style>{CONTENT_CSS}</style>
            <DocumentOutline editor={editor} isLocked={readOnly} />

            <div className='vy:flex vy:min-h-0 vy:min-w-0 vy:flex-1 vy:flex-col'>
                <DocumentToolbar editor={editor} isLocked={readOnly} onInsertImage={Picker === undefined ? undefined : () => setPickingImage(true)} />

                <div className='vy:flex vy:min-h-0 vy:flex-1 vy:justify-center vy:overflow-auto vy:overscroll-contain vy:md:px-4 vy:md:pb-8 vy:md:pt-4'>
                    <DocumentPage editor={editor} design={design} logoUrl={logoUrl} isLocked={readOnly} onEditSlot={openDesign} />
                </div>
            </div>

            <Inspector
                inspector={inspector}
                panel={panel}
                properties={(
                    <>
                        <BlockPanel editor={editor} isLocked={readOnly} />
                        <div aria-hidden='true' className='vy:my-1 vy:h-px vy:bg-foreground/[0.08]' />
                        <DesignPanel design={design} logoUrl={logoUrl} isLocked={readOnly} focusField={designField} imagePicker={Picker} onChange={changeDesign} onLogo={setLogo} />
                    </>
                )}
            />

            {onSelectionAction === undefined ? null : <SelectionActions editor={editor} onAction={onSelectionAction} />}
            {Picker === undefined || !isPickingImage ? null : <Picker isOpen onOpenChange={setPickingImage} onPick={insertImage} />}
        </div>
    );
};

export default DocumentEditor;
