import type { CodeEditorProps } from '../../../contracts/code-editor';
import { CODE_FONT, CODE_LINE_HEIGHT, CODE_PALETTES } from '@pollium/vyva-core/code';
import { fontStack } from '@pollium/vyva-core/themes';

const PlainCodeEditor = ({ value, colorScheme, readOnly, label, onChange }: CodeEditorProps) => (
    <textarea
        aria-label={label}
        value={value}
        readOnly={readOnly}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className='vy:size-full vy:resize-none vy:p-3 vy:text-[0.875rem] vy:outline-none'
        style={{ background: CODE_PALETTES[colorScheme].background, color: CODE_PALETTES[colorScheme].foreground, fontFamily: fontStack(CODE_FONT), lineHeight: CODE_LINE_HEIGHT }}
    />
);

export default PlainCodeEditor;
