import type { DeckFormat, DeckTheme, ImageElement, Slide, SlideElement, TableElement, TextElement } from './content';
import { canvasOf, isAccentBar, layoutSlide, type Canvas, type SlideLayout, type SlideSpec } from './slide-layouts';

type TextRole = 'title' | 'subtitle' | 'body' | 'left' | 'right' | 'quote' | 'author' | 'number' | 'label';

const ROLES_OF: Record<SlideLayout, TextRole[]> = {
    title: ['title', 'subtitle'],
    section: ['title', 'subtitle'],
    bullets: ['title', 'body'],
    'two-columns': ['title', 'left', 'right'],
    'image-left': ['title', 'body'],
    'image-right': ['title', 'body'],
    'image-full': ['title', 'subtitle'],
    quote: ['quote', 'author'],
    table: ['title'],
    'big-number': ['title', 'number', 'label'],
    closing: ['title', 'subtitle']
};

const marker = (role: TextRole): string => `{{${role}}}`;

const byPosition = (a: SlideElement, b: SlideElement): number => a.y - b.y || a.x - b.x;

const looksLikeTitle = (text: TextElement, canvas: Canvas): boolean =>
    text.style.isBold || text.style.fontSize >= 56 * canvas.unit;

interface ImageSource{
    fileId: string;
    alt: string;
    credit: string | null;
}

const IMAGE_LAYOUTS: readonly SlideLayout[] = ['image-left', 'image-right', 'image-full'];
const EMPTY_TABLE = [['', ''], ['', '']];

const specOf = (layout: SlideLayout, roles: Map<TextRole, string>, image: ImageSource | null, table: TableElement | undefined): SlideSpec => {
    const has = (role: TextRole) => roles.has(role);
    const spec: SlideSpec = { layout };

    if(has('title')) spec.title = marker('title');
    if(has('subtitle')) spec.subtitle = marker('subtitle');
    if(has('body')) spec.text = marker('body');
    if(has('left')) spec.left = { text: marker('left') };
    if(has('right')) spec.right = { text: marker('right') };
    if(has('quote')) spec.quote = marker('quote');
    if(has('author')) spec.quoteAuthor = marker('author');
    if(has('number')) spec.number = marker('number');
    if(has('label')) spec.numberLabel = marker('label');
    if(image !== null && IMAGE_LAYOUTS.includes(layout)){
        spec.imageFileId = image.fileId;
        spec.imageAlt = image.alt;
        if(image.credit !== null) spec.imageCredit = image.credit;
    }
    if(layout === 'table') spec.rows = table?.rows ?? EMPTY_TABLE;

    return spec;
};

interface TextRoles{
    roles: Map<TextRole, string>;
    used: Set<SlideElement>;
}

const textRoles = (slide: Slide, layout: SlideLayout, canvas: Canvas): TextRoles => {
    const texts = slide.elements.filter((element): element is TextElement => element.type === 'text').sort(byPosition);
    const biggest = [...texts].sort((a, b) => b.style.fontSize - a.style.fontSize)[0];
    const title = biggest !== undefined && (texts.length > 1 || looksLikeTitle(biggest, canvas)) ? biggest : undefined;
    const bodies = texts.filter((text) => text !== title);
    const wanted = ROLES_OF[layout];
    const roles = new Map<TextRole, string>();
    const used = new Set<SlideElement>();
    const assign = (role: TextRole, sources: TextElement[]) => {
        if(!wanted.includes(role) || sources.length === 0) return;
        roles.set(role, sources.map((source) => source.html).join(''));
        sources.forEach((source) => used.add(source));
    };

    if(layout === 'quote'){
        assign('quote', bodies.length > 0 ? bodies.slice(0, 1) : title === undefined ? [] : [title]);
        assign('author', bodies.slice(1, 2));
        return { roles, used };
    }

    assign('title', title === undefined ? [] : [title]);
    if(wanted.includes('left')){
        assign('left', bodies.slice(0, 1));
        assign('right', bodies.slice(1));
    }else if(wanted.includes('number')){
        assign('number', bodies.slice(0, 1));
        assign('label', bodies.slice(1));
    }else{
        assign(wanted.includes('body') ? 'body' : 'subtitle', bodies);
    }

    return { roles, used };
};

export const relayoutSlide = (slide: Slide, layout: SlideLayout, format: DeckFormat, theme: DeckTheme): Slide => {
    const canvas = canvasOf(format, theme);
    const { roles, used } = textRoles(slide, layout, canvas);
    const imageElement = slide.elements.find((element): element is ImageElement => element.type === 'image');
    const backgroundImage = slide.background?.type === 'image' ? slide.background : null;
    const image: ImageSource | null = imageElement ?? (backgroundImage === null ? null : { fileId: backgroundImage.fileId, alt: '', credit: null });
    const table = slide.elements.find((element): element is TableElement => element.type === 'table');
    const spec = specOf(layout, roles, image, table);
    const takesImage = spec.imageFileId !== undefined;
    if(takesImage && imageElement !== undefined) used.add(imageElement);
    if(layout === 'table' && table !== undefined) used.add(table);

    const fresh = layoutSlide(spec, format, theme);
    const elements = fresh.elements.map((element): SlideElement => {
        if(element.type !== 'text') return element;

        const role = [...roles.keys()].find((candidate) => element.html.includes(marker(candidate)));
        return role === undefined ? element : { ...element, html: roles.get(role) ?? element.html };
    });
    const kept = slide.elements.filter((element) => !used.has(element) && !isAccentBar(element, canvas));
    const isLayoutColor = slide.background?.type === 'color' && slide.background.color === theme.accent;
    const keptBackground = slide.background?.type === 'image'
        ? (takesImage && imageElement === undefined ? null : slide.background)
        : isLayoutColor ? null : slide.background;

    return {
        id: slide.id,
        background: fresh.background ?? keptBackground,
        elements: [...elements, ...kept],
        ...(fresh.frame === undefined ? {} : { frame: fresh.frame })
    };
};
