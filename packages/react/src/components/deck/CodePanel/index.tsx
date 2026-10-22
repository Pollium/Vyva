import Button from '../../ui/Button';
import SelectInput from '../../ui/SelectInput';
import { useMessages } from '../../../messages/context';
import { codeLanguageOptions } from '../../../utils/deck/code-languages';
import { numberOptions } from '../../../utils/deck/number-options';
import type { CodeElement, CodeLanguage } from '@pollium/vyva-core/content';
import { Code2 } from 'lucide-react';

const CODE_SIZES = [14, 16, 18, 20, 24, 28, 32, 40, 48];
const COLOR_SCHEMES = ['dark', 'light'] as const;

interface CodePanelProps{
    code: CodeElement;
    isLocked: boolean;
    onPatch: (change: (code: CodeElement) => CodeElement) => void;
    onEdit: () => void;
}

const CodePanel = ({ code, isLocked, onPatch, onEdit }: CodePanelProps) => {
    const t = useMessages();

    return (
        <div className='vy:flex vy:flex-col vy:gap-2'>
            <Button variant='secondary' size='sm' isDisabled={isLocked} onPress={onEdit}><Code2 className='vy:size-4' aria-hidden='true' />{t.deck.editCodeShort}</Button>
            <SelectInput label={t.editor.language} hideLabel isDisabled={isLocked} value={code.language} options={codeLanguageOptions(t)} onChange={(language: CodeLanguage) => onPatch((current) => ({ ...current, language }))} />
            <div className='vy:grid vy:grid-cols-2 vy:gap-2'>
                <SelectInput label={t.editor.fontSize} hideLabel isDisabled={isLocked} value={String(code.fontSize)} options={numberOptions(CODE_SIZES, code.fontSize, (size) => `${size} px`)} onChange={(value) => onPatch((current) => ({ ...current, fontSize: Number(value) }))} />
                <SelectInput label={t.deck.colors} hideLabel isDisabled={isLocked} value={code.colorScheme} options={COLOR_SCHEMES.map((scheme) => ({ value: scheme, label: t.deck.colorSchemes[scheme] }))} onChange={(colorScheme) => onPatch((current) => ({ ...current, colorScheme }))} />
            </div>
        </div>
    );
};

export default CodePanel;
