import type { Content, DeckContent, DocumentContent } from '@vyva/core/content';

export const documentOf = (content: Content): DocumentContent => {
    if(content.kind !== 'document') throw new Error(`The document editor was given ${content.kind} content`);

    return content;
};

export const deckOf = (content: Content): DeckContent => {
    if(content.kind !== 'deck') throw new Error(`The deck editor was given ${content.kind} content`);

    return content;
};
