import type { DeckContent, DocumentContent } from '@vyva/core/content';
import { markdownToBlocks } from '@vyva/core/markdown-blocks';
import { layoutSlide } from '@vyva/core/slide-layouts';
import { DECK_THEME, DEFAULT_DOCUMENT_DESIGN } from '@vyva/core/themes';

const DOCUMENT_MARKDOWN = `# Computer networks

A network connects devices so they can **share data**. This guide covers the basics for the first unit.

## The layers

- Physical: cables, radio and the signals they carry
- Link: frames between two neighbours
- Network: routing packets across networks

## A quick comparison

| Model | Layers | Used for |
|---|---|---|
| OSI | 7 | Teaching |
| TCP/IP | 4 | The internet |

## Try it

\`\`\`bash
ip addr show
\`\`\`

The mass of the payload is irrelevant, but the time is not: $t = \\frac{d}{v}$.`;

export const SAMPLE_DOCUMENT: DocumentContent = {
    kind: 'document',
    design: { ...DEFAULT_DOCUMENT_DESIGN, headerText: 'Vyva · Playground' },
    blocks: markdownToBlocks(DOCUMENT_MARKDOWN)
};

export const SAMPLE_DECK: DeckContent = {
    kind: 'deck',
    format: '16:9',
    theme: DECK_THEME,
    footer: { left: 'Vyva', center: 'Playground' },
    slides: [
        layoutSlide({ layout: 'title', title: 'Computer networks', subtitle: 'Unit 1 · The basics' }, '16:9', DECK_THEME),
        layoutSlide({ layout: 'bullets', title: 'The layers', bullets: ['Physical', 'Link', 'Network', 'Transport'] }, '16:9', DECK_THEME),
        layoutSlide({ layout: 'two-columns', title: 'Two models', left: { heading: 'OSI', bullets: ['7 layers', 'Used to teach'] }, right: { heading: 'TCP/IP', bullets: ['4 layers', 'Runs the internet'] } }, '16:9', DECK_THEME),
        layoutSlide({ layout: 'table', title: 'Common ports', rows: [['Service', 'Port'], ['HTTP', '80'], ['HTTPS', '443'], ['SSH', '22']] }, '16:9', DECK_THEME),
        layoutSlide({ layout: 'closing', title: 'Thank you!', subtitle: 'Questions?' }, '16:9', DECK_THEME)
    ]
};
