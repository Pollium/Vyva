import katex from 'katex';

const MATH = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?=[^\s$])((?:\\\$|[^$\n])*?[^\s\\])\$(?!\d)/g;
const TAG = /(<[^>]*>)/;
const ENTITY = /&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g;
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'', '&#x27;': '\'', '&nbsp;': '\u00a0' };
const PLACEHOLDER = /MATHSLOT(\d+)X/g;

interface MathMatch{
    source: string;
    latex: string;
    isDisplay: boolean;
}

const latexOf = (match: RegExpExecArray): MathMatch => ({
    source: match[0],
    latex: (match[1] ?? match[2] ?? match[3] ?? match[4] ?? '').trim(),
    isDisplay: match[1] !== undefined || match[2] !== undefined
});

export const hasMath = (text: string): boolean => text.search(MATH) !== -1;

export const mathMarkup = (latex: string, isDisplay: boolean): string =>
    katex.renderToString(latex, { displayMode: isDisplay, output: 'mathml', throwOnError: false, strict: 'ignore' });

const renderText = (text: string): string => {
    const decoded = text.replace(ENTITY, (entity) => ENTITIES[entity] ?? entity);
    if(!hasMath(decoded)) return text;

    let html = '';
    let last = 0;
    for(const match of decoded.matchAll(MATH)){
        const at = match.index ?? 0;
        const { latex, isDisplay } = latexOf(match as RegExpExecArray);
        html += escape(decoded.slice(last, at)) + mathMarkup(latex, isDisplay);
        last = at + match[0].length;
    }

    return html + escape(decoded.slice(last));
};

const escape = (text: string): string => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char);

const CODE_OPEN = /^<(?:code|pre)[\s>]/i;
const CODE_CLOSE = /^<\/(?:code|pre)>/i;

export const withMath = (html: string): string => {
    if(!html.includes('$') && !html.includes('\\')) return html;

    let codeDepth = 0;
    return html.split(TAG).map((part) => {
        if(CODE_OPEN.test(part)) codeDepth += 1;
        else if(CODE_CLOSE.test(part)) codeDepth = Math.max(0, codeDepth - 1);
        if(part.startsWith('<') || codeDepth > 0) return part;

        return renderText(part);
    }).join('');
};

export interface ProtectedMath{
    text: string;
    restore: (output: string, write: (source: string) => string) => string;
}

export const protectMath = (text: string): ProtectedMath => {
    const sources: string[] = [];
    const protectedText = text.replace(MATH, (source) => {
        sources.push(source);
        return `MATHSLOT${sources.length - 1}X`;
    });

    return {
        text: protectedText,
        restore: (output, write) => sources.length === 0 ? output : output.replace(PLACEHOLDER, (slot, index: string) => {
            const source = sources[Number(index)];
            return source === undefined ? slot : write(source);
        })
    };
};
