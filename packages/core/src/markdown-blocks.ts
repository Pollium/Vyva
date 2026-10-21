import MarkdownIt from 'markdown-it';
import type { DocumentBlock } from './content';
import { escapeHtml } from './escape';
import { newId } from './ids';
import { protectMath } from './math';

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false });

type Token = ReturnType<MarkdownIt['parse']>[number];

const defaultLinkOpen = markdown.renderer.rules.link_open
    ?? ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
    tokens[index].attrSet('rel', 'noopener noreferrer');
    tokens[index].attrSet('target', '_blank');
    return defaultLinkOpen(tokens, index, options, env, self);
};

export const ASSET_SCHEME = 'asset:';
const FILE_SOURCE = /^asset:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

markdown.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const match = FILE_SOURCE.exec(token.attrGet('src') ?? '');
    if(match === null) return '';

    return `<img alt="${escapeHtml(self.renderInlineAsText(token.children ?? [], options, env))}" data-file-id="${match[1]}">`;
};

const TASK = /^\[( |x|X)\]\s+/;

const firstInlineOf = (tokens: Token[], from: number, level: number): Token | undefined => {
    for(let at = from + 1; at < tokens.length; at += 1){
        const token = tokens[at];
        if(token.type === 'list_item_close' && token.level === level - 2) return undefined;
        if(token.type === 'inline' && token.level === level) return token;
    }

    return undefined;
};

const markTaskLists = (tokens: Token[]) => {
    tokens.forEach((token, index) => {
        if(token.type !== 'bullet_list_open') return;

        const close = tokens.findIndex((candidate, at) => at > index && candidate.type === 'bullet_list_close' && candidate.level === token.level);
        const items = tokens.slice(index + 1, close)
            .map((candidate, at) => ({ candidate, at: index + 1 + at }))
            .filter(({ candidate }) => candidate.type === 'list_item_open' && candidate.level === token.level + 1)
            .map(({ candidate, at }) => ({ item: candidate, inline: firstInlineOf(tokens, at, token.level + 3) }));
        if(items.length === 0 || !items.every(({ inline }) => inline !== undefined && TASK.test(inline.content))) return;

        token.attrSet('data-type', 'taskList');
        for(const { item, inline } of items){
            if(inline === undefined) continue;

            const isChecked = TASK.exec(inline.content)?.[1].toLowerCase() === 'x';
            item.attrSet('data-type', 'taskItem');
            item.attrSet('data-checked', String(isChecked));

            const first = inline.children?.[0];
            if(first !== undefined && first.type === 'text') first.content = first.content.replace(TASK, '');
            inline.content = inline.content.replace(TASK, '');
        }
    });
};

const topLevelGroups = (tokens: Token[]): Token[][] => {
    const groups: Token[][] = [];
    let current: Token[] = [];
    let depth = 0;

    for(const token of tokens){
        current.push(token);
        depth += token.nesting;
        if(depth === 0){
            groups.push(current);
            current = [];
        }
    }
    if(current.length > 0) groups.push(current);

    return groups;
};

export const markdownToHtmlBlocks = (source: string): string[] => {
    const math = protectMath(source);
    const env = {};
    const tokens = markdown.parse(math.text, env);
    markTaskLists(tokens);

    return topLevelGroups(tokens)
        .map((group) => math.restore(markdown.renderer.render(group, markdown.options, env).trim(), escapeHtml))
        .filter((html) => html !== '');
};

export const markdownToBlocks = (source: string): DocumentBlock[] =>
    markdownToHtmlBlocks(source).map((html) => ({ id: newId(), html }));

export const inlineMarkdown = (source: string): string => {
    const math = protectMath(source);

    return math.restore(markdown.renderInline(math.text), escapeHtml);
};
