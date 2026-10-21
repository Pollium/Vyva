import { DomUtils, parseDocument } from 'htmlparser2';

type ChildNode = ReturnType<typeof parseDocument>['children'][number];
type Element = Parameters<typeof DomUtils.getAttributeValue>[0];

export interface Run{
    text: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    code: boolean;
    color: string | null;
    highlight: string | null;
    sizePx: number | null;
    link: string | null;
    isBreak?: boolean;
}

export type Align = 'left' | 'center' | 'right' | 'justify';

export type Block =
    | { kind: 'paragraph'; runs: Run[]; align: Align | null; quote: boolean }
    | { kind: 'heading'; level: 1 | 2 | 3 | 4; runs: Run[]; align: Align | null }
    | { kind: 'list'; ordered: boolean; items: Array<{ runs: Run[]; checked: boolean | null; level: number }> }
    | { kind: 'table'; rows: Array<Array<{ runs: Run[]; header: boolean }>> }
    | { kind: 'code'; language: string | null; text: string }
    | { kind: 'image'; fileId: string; alt: string; widthPercent: number | null; widthPx: number | null; align: 'left' | 'center' | 'right' }
    | { kind: 'rule' }
    | { kind: 'pageBreak' };

const BASE: Run = { text: '', bold: false, italic: false, underline: false, strike: false, code: false, color: null, highlight: null, sizePx: null, link: null };
const HEADING_LEVELS = new Map<string, 1 | 2 | 3 | 4>([['h1', 1], ['h2', 2], ['h3', 3], ['h4', 4]]);

const isElement = (node: ChildNode): node is Element => DomUtils.isTag(node);

const styleOf = (element: Element): Record<string, string> => Object.fromEntries((element.attribs.style ?? '').split(';')
    .map((part) => part.split(':').map((value) => value.trim()))
    .filter((pair): pair is [string, string] => pair.length >= 2 && pair[0] !== '')
    .map(([key, ...value]) => [key.toLowerCase(), value.join(':')]));

const COLOR = /^#[0-9a-f]{6}$/i;

const toHex = (value: string | undefined): string | null => {
    if(value === undefined) return null;
    if(COLOR.test(value)) return value.toLowerCase();
    if(/^#[0-9a-f]{3}$/i.test(value)) return `#${value.slice(1).split('').map((char) => char + char).join('')}`.toLowerCase();

    const match = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})/i.exec(value);
    return match === null ? null : `#${match.slice(1, 4).map((part) => Math.min(255, Number(part)).toString(16).padStart(2, '0')).join('')}`;
};

const sizeToPx = (value: string | undefined): number | null => {
    if(value === undefined) return null;
    const match = /^(\d+(?:\.\d+)?)(px|pt|em|rem)$/.exec(value);
    if(match === null) return null;

    const amount = Number(match[1]);
    return match[2] === 'pt' ? amount * 96 / 72 : match[2] === 'px' ? amount : amount * 16;
};

const alignOf = (element: Element): Align | null => {
    const align = styleOf(element)['text-align'];
    return align === 'left' || align === 'center' || align === 'right' || align === 'justify' ? align : null;
};

const runsOf = (nodes: ChildNode[], inherited: Run = BASE): Run[] => nodes.flatMap((node): Run[] => {
    if(node.type === 'text') return node.data === '' ? [] : [{ ...inherited, text: node.data.replace(/\s+/g, ' ') }];
    if(!isElement(node)) return [];

    const style = styleOf(node);
    const next: Run = {
        ...inherited,
        bold: inherited.bold || node.name === 'strong' || node.name === 'b' || style['font-weight'] === '700' || style['font-weight'] === 'bold',
        italic: inherited.italic || node.name === 'em' || node.name === 'i',
        underline: inherited.underline || node.name === 'u',
        strike: inherited.strike || node.name === 's',
        code: inherited.code || node.name === 'code',
        color: toHex(style.color) ?? inherited.color,
        highlight: node.name === 'mark' ? toHex(style['background-color']) ?? '#fff3a3' : toHex(style['background-color']) ?? inherited.highlight,
        sizePx: sizeToPx(style['font-size']) ?? inherited.sizePx,
        link: node.name === 'a' && typeof node.attribs.href === 'string' ? node.attribs.href : inherited.link
    };

    if(node.name === 'br') return [{ ...inherited, text: '', isBreak: true }];
    if(node.name === 'img' || node.name === 'input' || node.name === 'label') return [];

    return runsOf(node.children, next);
});

const textOf = (nodes: ChildNode[]): string => nodes.map((node) => node.type === 'text' ? node.data : isElement(node) ? textOf(node.children) : '').join('');

const trimRuns = (runs: Run[]): Run[] => {
    const copy = runs.map((run) => ({ ...run }));
    if(copy.length > 0) copy[0].text = copy[0].text.replace(/^\s+/, '');
    if(copy.length > 0) copy[copy.length - 1].text = copy[copy.length - 1].text.replace(/\s+$/, '');

    return copy.filter((run) => run.text !== '' || run.isBreak === true);
};

const imageOf = (element: Element): Block | null => {
    const fileId = element.attribs['data-file-id'];
    if(fileId === undefined) return null;

    const width = styleOf(element).width ?? '';
    const percent = /^(\d+(?:\.\d+)?)%$/.exec(width);
    const pixels = /^(\d+(?:\.\d+)?)px$/.exec(width);
    const align = element.attribs['data-align'];

    return {
        kind: 'image',
        fileId,
        alt: element.attribs.alt ?? '',
        widthPercent: percent === null ? null : Number(percent[1]),
        widthPx: pixels === null ? null : Number(pixels[1]),
        align: align === 'left' || align === 'right' ? align : 'center'
    };
};

const listItems = (list: Element, level: number): Extract<Block, { kind: 'list' }>['items'] => list.children.filter(isElement).filter((child) => child.name === 'li').flatMap((item) => {
    const nested = item.children.filter(isElement).filter((child) => child.name === 'ul' || child.name === 'ol');
    const own = item.children.filter((child) => !(isElement(child) && (child.name === 'ul' || child.name === 'ol')));
    const checked = item.attribs['data-type'] === 'taskItem' ? item.attribs['data-checked'] === 'true' : null;

    return [
        { runs: trimRuns(runsOf(own)), checked, level },
        ...nested.flatMap((child) => listItems(child, level + 1))
    ];
});

const tableRows = (table: Element): Extract<Block, { kind: 'table' }>['rows'] => {
    const rows: Extract<Block, { kind: 'table' }>['rows'] = [];
    const visit = (node: Element) => {
        for(const child of node.children.filter(isElement)){
            if(child.name === 'tr'){
                rows.push(child.children.filter(isElement).filter((cell) => cell.name === 'td' || cell.name === 'th').map((cell) => ({ runs: trimRuns(runsOf(cell.children)), header: cell.name === 'th' })));
            }else if(['thead', 'tbody', 'tfoot'].includes(child.name)){
                visit(child);
            }
        }
    };
    visit(table);

    return rows;
};

const blockOf = (element: Element): Block[] => {
    const { name } = element;
    const level = HEADING_LEVELS.get(name);
    if(level !== undefined) return [{ kind: 'heading', level, runs: trimRuns(runsOf(element.children)), align: alignOf(element) }];
    if(name === 'p'){
        const images = element.children.filter(isElement).filter((child) => child.name === 'img').flatMap((child) => imageOf(child) ?? []);
        const runs = trimRuns(runsOf(element.children));
        return [...(runs.length === 0 && images.length > 0 ? [] : [{ kind: 'paragraph' as const, runs, align: alignOf(element), quote: false }]), ...images];
    }
    if(name === 'blockquote') return element.children.filter(isElement).flatMap(blockOf).map((block) => block.kind === 'paragraph' ? { ...block, quote: true } : block);
    if(name === 'ul' || name === 'ol') return [{ kind: 'list', ordered: name === 'ol', items: listItems(element, 0) }];
    if(name === 'table') return [{ kind: 'table', rows: tableRows(element) }];
    if(name === 'pre'){
        const code = element.children.filter(isElement).find((child) => child.name === 'code');
        const language = /language-([a-z0-9+#-]+)/.exec(code?.attribs.class ?? element.attribs.class ?? '')?.[1] ?? null;
        return [{ kind: 'code', language, text: textOf(element.children).replace(/\n$/, '') }];
    }
    if(name === 'img'){
        const image = imageOf(element);
        return image === null ? [] : [image];
    }
    if(name === 'hr') return [{ kind: 'rule' }];
    if(name === 'div' && element.attribs['data-type'] === 'page-break') return [{ kind: 'pageBreak' }];
    if(name === 'div') return element.children.filter(isElement).flatMap(blockOf);

    return [];
};

export const blocksOfHtml = (html: string): Block[] =>
    parseDocument(html).children.filter(isElement).flatMap(blockOf);

export const plainOfRuns = (runs: Run[]): string => runs.map((run) => run.isBreak === true ? '\n' : run.text).join('');
