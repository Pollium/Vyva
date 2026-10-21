import type { BundleImage, ExportBundle, ExportedFile } from './bundle';
import { blocksOfHtml, type Align, type Block, type Run } from './html-blocks';
import { fitWithin } from './image-size';
import { CODE_FONT } from '@vyva/core/code';
import type { DocumentContent } from '@vyva/core/content';
import {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    Footer,
    Header,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    Packer,
    PageBreak,
    PageNumber,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    type FileChild,
    type ParagraphChild
} from 'docx';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const TWIPS_PER_MM = 56.7;
const A4_WIDTH_MM = 210;
const PX_PER_MM = 3.78;
const CODE_FILL = 'F3F4F6';
const MUTED = '6B7280';
const LINE = 'D5D9E0';
const DOCX_IMAGE_TYPES: Record<string, 'png' | 'jpg' | 'gif'> = { png: 'png', jpg: 'jpg', gif: 'gif' };

const hex = (color: string): string => color.replace('#', '').toUpperCase();

const lighten = (color: string, amount: number): string => {
    const value = hex(color);
    const channel = (offset: number) => Math.round(parseInt(value.slice(offset, offset + 2), 16) * amount + 255 * (1 - amount)).toString(16).padStart(2, '0');

    return `${channel(0)}${channel(2)}${channel(4)}`.toUpperCase();
};

const ALIGNMENTS: Record<Align, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED
};

const HEADINGS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4] as const;

const levels = (bullet: boolean) => [0, 1, 2].map((level) => ({
    level,
    format: bullet ? LevelFormat.BULLET : [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][level],
    text: bullet ? ['•', '◦', '▪'][level] : `%${level + 1}.`,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360 * (level + 1), hanging: 260 } } }
}));

class DocxComposer{
    #bundle: ExportBundle;
    #content: DocumentContent;
    #listInstance = 0;

    constructor(bundle: ExportBundle, content: DocumentContent){
        this.#bundle = bundle;
        this.#content = content;
    }

    get accent(): string{
        return hex(this.#content.design.accentColor);
    }

    get maxImageWidth(): number{
        const { margins } = this.#content.design;
        return Math.round((A4_WIDTH_MM - margins.left - margins.right) * PX_PER_MM);
    }

    runs(runs: Run[], extra: { bold?: boolean; color?: string; size?: number } = {}): ParagraphChild[]{
        return runs.map((run) => {
            if(run.isBreak === true) return new TextRun({ text: '', break: 1 });

            const text = new TextRun({
                text: run.text,
                bold: run.bold || extra.bold,
                italics: run.italic,
                strike: run.strike,
                ...(run.underline || run.link !== null ? { underline: {} } : {}),
                ...(run.color !== null ? { color: hex(run.color) } : run.link !== null ? { color: this.accent } : extra.color === undefined ? {} : { color: extra.color }),
                ...(run.code ? { font: CODE_FONT } : {}),
                ...(run.sizePx !== null ? { size: Math.round(run.sizePx * 0.75 * 2) } : extra.size === undefined ? {} : { size: extra.size }),
                ...(run.highlight !== null ? { shading: { type: ShadingType.CLEAR, fill: hex(run.highlight), color: 'auto' } } : run.code ? { shading: { type: ShadingType.CLEAR, fill: CODE_FILL, color: 'auto' } } : {})
            });

            return run.link === null || !/^(https?:|mailto:)/i.test(run.link) ? text : new ExternalHyperlink({ link: run.link, children: [text] });
        });
    }

    image(image: BundleImage | undefined, block: Extract<Block, { kind: 'image' }>): Paragraph | null{
        const type = image === undefined ? undefined : DOCX_IMAGE_TYPES[image.extension];
        if(image === undefined || type === undefined) return null;

        const maxWidth = block.widthPx !== null
            ? Math.min(this.maxImageWidth, Math.round(block.widthPx))
            : block.widthPercent === null ? this.maxImageWidth : Math.round(this.maxImageWidth * Math.min(100, block.widthPercent) / 100);
        const size = fitWithin(image.size, maxWidth, 900);
        const alt = block.alt;

        return new Paragraph({
            alignment: block.align === 'left' ? AlignmentType.LEFT : block.align === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [new ImageRun({ type, data: image.data, transformation: size, altText: { name: alt || 'Image', description: alt, title: alt } })]
        });
    }

    block(block: Block): FileChild[]{
        if(block.kind === 'heading'){
            return [new Paragraph({ heading: HEADINGS[block.level - 1], ...(block.align === null ? {} : { alignment: ALIGNMENTS[block.align] }), children: this.runs(block.runs) })];
        }
        if(block.kind === 'paragraph'){
            return [new Paragraph({
                spacing: { after: 120 },
                ...(block.align === null ? {} : { alignment: ALIGNMENTS[block.align] }),
                ...(block.quote ? { indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: this.accent, space: 8 } } } : {}),
                children: this.runs(block.runs, block.quote ? { color: MUTED } : {})
            })];
        }
        if(block.kind === 'list'){
            this.#listInstance += 1;
            const instance = this.#listInstance;
            return block.items.map((item) => item.checked === null
                ? new Paragraph({ numbering: { reference: block.ordered ? 'numbers' : 'bullets', level: Math.min(item.level, 2), instance }, children: this.runs(item.runs) })
                : new Paragraph({ indent: { left: 360 * (item.level + 1) }, children: [new TextRun({ text: item.checked ? '☑ ' : '☐ ', color: this.accent }), ...this.runs(item.runs)] }));
        }
        if(block.kind === 'table'){
            const columns = Math.max(1, ...block.rows.map((row) => row.length));
            return [new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: block.rows.map((row) => new TableRow({
                    tableHeader: row.every((cell) => cell.header),
                    children: Array.from({ length: columns }, (_, index) => {
                        const cell = row[index] ?? { runs: [], header: false };
                        return new TableCell({
                            children: [new Paragraph({ children: this.runs(cell.runs, cell.header ? { bold: true } : {}) })],
                            ...(cell.header ? { shading: { type: ShadingType.CLEAR, fill: lighten(this.#content.design.accentColor, 0.12), color: 'auto' } } : {}),
                            margins: { top: 60, bottom: 60, left: 100, right: 100 }
                        });
                    })
                }))
            }), new Paragraph({ children: [] })];
        }
        if(block.kind === 'code'){
            return block.text.split('\n').map((line, index, lines) => new Paragraph({
                shading: { type: ShadingType.CLEAR, fill: CODE_FILL, color: 'auto' },
                spacing: { before: index === 0 ? 120 : 0, after: index === lines.length - 1 ? 160 : 0 },
                children: [new TextRun({ text: line === '' ? ' ' : line, font: CODE_FONT, size: 18 })]
            }));
        }
        if(block.kind === 'image'){
            const paragraph = this.image(this.#bundle.images.get(block.fileId), block);
            return paragraph === null ? [] : [paragraph];
        }
        if(block.kind === 'rule') return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 4 } }, children: [] })];

        return [new Paragraph({ children: [new PageBreak()] })];
    }

    body(): FileChild[]{
        return this.#content.blocks.flatMap((block) => blocksOfHtml(block.html)).flatMap((block) => this.block(block));
    }

    header(): Header{
        const { design } = this.#content;
        const logo = design.headerLogoFileId === null ? undefined : this.#bundle.images.get(design.headerLogoFileId);
        const type = logo === undefined ? undefined : DOCX_IMAGE_TYPES[logo.extension];
        const children: ParagraphChild[] = [];
        if(logo !== undefined && type !== undefined) children.push(new ImageRun({ type, data: logo.data, transformation: fitWithin(logo.size, 160, 40), altText: { name: 'Logo', description: 'Logo', title: 'Logo' } }));
        if(design.headerText.trim() !== '') children.push(new TextRun({ text: `${children.length > 0 ? '   ' : ''}${design.headerText}`, color: MUTED, size: 16 }));

        return new Header({ children: children.length === 0 ? [] : [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } }, children })] });
    }

    footer(): Footer{
        const { design } = this.#content;
        const children: ParagraphChild[] = [];
        if(design.footerText.trim() !== '') children.push(new TextRun({ text: design.showPageNumbers ? `${design.footerText}  ·  ` : design.footerText, color: MUTED, size: 16 }));
        if(design.showPageNumbers) children.push(new TextRun({ children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], color: MUTED, size: 16 }));

        return new Footer({ children: children.length === 0 ? [] : [new Paragraph({ alignment: AlignmentType.RIGHT, children })] });
    }
}

export const buildDocx = async (content: DocumentContent, bundle: ExportBundle): Promise<ExportedFile> => {
    const composer = new DocxComposer(bundle, content);
    const { design } = content;
    const size = Math.round(design.baseSize * 2);
    const ink = hex(design.textColor);
    const accent = composer.accent;
    const margin = (mm: number) => Math.round(mm * TWIPS_PER_MM);

    const document = new Document({
        title: bundle.title,
        styles: {
            default: {
                document: { run: { font: design.font, size, color: ink }, paragraph: { spacing: { line: 300 } } },
                heading1: { run: { font: design.font, size: size * 2, bold: true, color: accent }, paragraph: { spacing: { before: 240, after: 120 } } },
                heading2: { run: { font: design.font, size: Math.round(size * 1.5), bold: true, color: accent }, paragraph: { spacing: { before: 280, after: 100 } } },
                heading3: { run: { font: design.font, size: Math.round(size * 1.2), bold: true, color: accent }, paragraph: { spacing: { before: 220, after: 80 } } },
                heading4: { run: { font: design.font, size: Math.round(size * 1.05), bold: true, color: accent }, paragraph: { spacing: { before: 200, after: 60 } } },
                hyperlink: { run: { color: accent, underline: {} } }
            }
        },
        numbering: { config: [{ reference: 'bullets', levels: levels(true) }, { reference: 'numbers', levels: levels(false) }] },
        sections: [{
            properties: { page: { margin: { top: margin(design.margins.top), bottom: margin(design.margins.bottom), left: margin(design.margins.left), right: margin(design.margins.right) } } },
            headers: { default: composer.header() },
            footers: { default: composer.footer() },
            children: composer.body()
        }]
    });

    return { data: await Packer.toBuffer(document), contentType: DOCX_MIME, extension: 'docx' };
};
