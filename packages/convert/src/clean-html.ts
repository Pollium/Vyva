import sanitize from 'sanitize-html';

const COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;
const FONT_SIZE = /^(\d{1,3}(\.\d{1,2})?)(px|pt|em|rem|%)$/;
const ALIGN = /^(left|right|center|justify)$/;
const LINE_HEIGHT = /^(\d(\.\d{1,2})?|\d{2,3}%)$/;
const WIDTH = /^(\d{1,4}(\.\d{1,2})?)(px|%)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const TEXT_STYLES = {
    color: [COLOR],
    'background-color': [COLOR],
    'font-size': [FONT_SIZE],
    'text-align': [ALIGN],
    'line-height': [LINE_HEIGHT]
};

const OPTIONS: sanitize.IOptions = {
    allowedTags: [
        'p', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'span', 'a', 'br', 'hr',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'sup', 'sub',
        'table', 'colgroup', 'col', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'div', 'label', 'input'
    ],
    allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['data-file-id', 'alt', 'width', 'style', { name: 'data-align', multiple: false, values: ['left', 'center', 'right'] }],
        ol: ['start'],
        ul: ['data-type'],
        li: ['data-type', 'data-checked'],
        code: ['class'],
        pre: ['class'],
        th: ['colspan', 'rowspan', 'colwidth', 'style'],
        td: ['colspan', 'rowspan', 'colwidth', 'style'],
        col: ['style'],
        div: ['data-type', 'data-tone'],
        input: ['type', 'checked', 'disabled'],
        '*': ['style']
    },
    allowedClasses: {
        code: [/^language-[a-z0-9+#-]{1,30}$/],
        pre: [/^language-[a-z0-9+#-]{1,30}$/]
    },
    allowedStyles: {
        '*': TEXT_STYLES,
        img: { width: [WIDTH] },
        col: { width: [WIDTH] },
        td: { ...TEXT_STYLES, width: [WIDTH] },
        th: { ...TEXT_STYLES, width: [WIDTH] }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed', 'svg', 'math'],
    exclusiveFilter: (frame) =>
        (frame.tag === 'img' && !UUID.test(frame.attribs['data-file-id'] ?? ''))
        || (frame.tag === 'input' && frame.attribs.type !== 'checkbox')
        || (frame.tag === 'div' && frame.attribs['data-type'] !== undefined && !['page-break', 'callout'].includes(frame.attribs['data-type'])),
    transformTags: {
        a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' } }),
        input: (tagName, attribs) => ({ tagName, attribs: { type: attribs.type ?? '', ...(attribs.checked === undefined ? {} : { checked: 'checked' }), disabled: 'disabled' } })
    }
};

export const cleanHtml = (html: string): string => sanitize(html, OPTIONS).trim();
