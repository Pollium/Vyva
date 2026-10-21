const STYLE_ATTRIBUTE = /\sstyle="([^"]*)"/g;
const DECLARATION = /([a-z-]+)\s*:\s*((?:&#?\w+;|[^;])*)/gi;

type StyleEdit = (property: string, value: string) => string | null;

export const editInlineStyles = (html: string, edit: StyleEdit): string =>
    html.replace(STYLE_ATTRIBUTE, (_match, declarations: string) => {
        const kept = [...declarations.matchAll(DECLARATION)].flatMap(([, property, value]) => {
            const name = property.toLowerCase();
            const next = edit(name, value.trim());
            return next === null ? [] : [`${name}:${next}`];
        });

        return kept.length === 0 ? '' : ` style="${kept.join(';')}"`;
    });

export const withoutInlineStyles = (html: string, properties: readonly string[]): string =>
    editInlineStyles(html, (property, value) => properties.includes(property) ? null : value);
