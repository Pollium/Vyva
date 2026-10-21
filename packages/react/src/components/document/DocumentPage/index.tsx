import type { DesignField } from '../DesignPanel';
import { useMessages } from '../../../messages/context';
import { EditorContent, type Editor } from '@tiptap/react';
import type { DocumentDesign } from '@vyva/core/content';
import { fontStack } from '@vyva/core/themes';
import type { KeyboardEvent } from 'react';

const PX_PER_MM = 3.78;

const pageStyle = (design: DocumentDesign, pageBreakLabel: string): Record<`--${string}`, string> => {
    const margin = (value: number) => `${(value * PX_PER_MM).toFixed(1)}px`;

    return {
        '--vy-doc-font': fontStack(design.font),
        '--vy-doc-size': `${design.baseSize}pt`,
        '--vy-doc-text': design.textColor,
        '--vy-doc-accent': design.accentColor,
        '--vy-doc-pad-top': margin(design.margins.top),
        '--vy-doc-pad-right': margin(design.margins.right),
        '--vy-doc-pad-bottom': margin(design.margins.bottom),
        '--vy-doc-pad-left': margin(design.margins.left),
        '--vy-page-break-label': JSON.stringify(pageBreakLabel)
    };
};

interface DocumentPageProps{
    editor: Editor;
    design: DocumentDesign;
    logoUrl: string | null;
    isLocked: boolean;
    onEditSlot: (field: DesignField) => void;
}

const DocumentPage = ({ editor, design, logoUrl, isLocked, onEditSlot }: DocumentPageProps) => {
    const t = useMessages();
    const hasHeader = logoUrl !== null || design.headerText.trim() !== '';
    const hasFooter = design.footerText.trim() !== '';
    const slotKeys = (field: DesignField) => (event: KeyboardEvent<HTMLElement>) => {
        if(event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onEditSlot(field);
    };

    return (
        <article className={`vy-doc vy-doc--editor vy:h-max vy:rounded-md vy:shadow-md vy:ring-1 vy:ring-black/5 vy:max-md:rounded-none vy:max-md:shadow-none vy:max-md:ring-0 ${isLocked ? 'vy:opacity-80' : ''}`} style={pageStyle(design, t.document.pageBreak)}>
            {hasHeader ? (
                <header
                    className='vy-doc-header vy-doc-header--editable'
                    role='button'
                    tabIndex={0}
                    title={t.document.editHeader}
                    aria-label={t.document.editHeader}
                    onClick={() => onEditSlot('header')}
                    onKeyDown={slotKeys('header')}
                >
                    {logoUrl === null ? null : <img src={logoUrl} alt='' />}
                    <span>{design.headerText}</span>
                </header>
            ) : null}
            <EditorContent editor={editor} />
            {hasFooter ? (
                <footer
                    className='vy-doc-footer vy-doc-footer--editable'
                    role='button'
                    tabIndex={0}
                    title={t.document.editFooter}
                    aria-label={t.document.editFooter}
                    onClick={() => onEditSlot('footer')}
                    onKeyDown={slotKeys('footer')}
                >
                    <span>{design.footerText}</span>
                </footer>
            ) : null}
        </article>
    );
};

export default DocumentPage;
