import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import SelectInput from '../../ui/SelectInput';
import type { CodeEditor } from '../../../contracts/code-editor';
import { useMessages } from '../../../messages/context';
import { codeLanguageOptions } from '../../../utils/deck/code-languages';
import { MAX_CODE_TEXT, type CodeElement, type CodeLanguage } from '@pollium/vyva-core/content';
import { useState } from 'react';

interface CodeEditorDialogProps{
    element: CodeElement;
    isLocked: boolean;
    editor: CodeEditor;
    onSave: (code: string, language: CodeLanguage) => void;
    onClose: () => void;
}

const CodeEditorDialog = ({ element, isLocked, editor: Editor, onSave, onClose }: CodeEditorDialogProps) => {
    const t = useMessages();
    const [code, setCode] = useState(element.code);
    const [language, setLanguage] = useState<CodeLanguage>(element.language);

    return (
        <Modal isOpen onOpenChange={(isOpen) => { if(!isOpen) onClose(); }} title={t.deck.editCodeShort} width='wide'>
            <div className='vy:flex vy:flex-col vy:gap-4'>
                <SelectInput label={t.editor.language} className='vy:w-56' value={language} options={codeLanguageOptions(t)} onChange={setLanguage} />

                <div className='vy:h-[55vh] vy:overflow-hidden vy:rounded-xl vy:border vy:border-foreground/10'>
                    <Editor value={code} language={language} colorScheme={element.colorScheme} readOnly={isLocked} label={t.deck.code} onChange={(value) => setCode(value.slice(0, MAX_CODE_TEXT))} />
                </div>

                <div className='vy:flex vy:justify-end vy:gap-2'>
                    <Button variant='secondary' onPress={onClose}>{t.ui.cancel}</Button>
                    <Button isDisabled={isLocked} onPress={() => onSave(code.trimEnd(), language)}>{t.deck.saveCode}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default CodeEditorDialog;
