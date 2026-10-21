import type { SlidePart, SlideParts } from './pptx-package';
import { all, attr, first, kid, kids, type XmlElement } from './pptx-xml';

export const TITLE_TYPES = ['title', 'ctrTitle'];
const MASTER_TYPES: Record<string, string> = { ctrTitle: 'title', subTitle: 'body', obj: 'body' };

export const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const placeholderType = (shape: XmlElement): string => attr(first(shape, 'p:ph'), 'type') ?? 'body';
const masterType = (type: string): string => MASTER_TYPES[type] ?? type;
const placeholdersOf = (part: SlidePart | null): XmlElement[] =>
    part?.tree === undefined ? [] : all(part.tree, 'p:sp').filter((shape) => first(shape, 'p:ph') !== undefined);

export const placeholderChain = (shape: XmlElement, placeholder: XmlElement, parts: SlideParts): XmlElement[] => {
    const type = attr(placeholder, 'type') ?? 'body';
    const idx = attr(placeholder, 'idx');
    const layoutShapes = placeholdersOf(parts.layout);
    const inLayout = (idx === undefined ? undefined : layoutShapes.find((candidate) => attr(first(candidate, 'p:ph'), 'idx') === idx))
        ?? layoutShapes.find((candidate) => placeholderType(candidate) === type);
    const wanted = masterType(inLayout === undefined ? type : placeholderType(inLayout));
    const inMaster = placeholdersOf(parts.master).find((candidate) => masterType(placeholderType(candidate)) === wanted);

    return [shape, inLayout, inMaster].filter(isDefined);
};

export const levelOf = (shape: XmlElement): XmlElement | undefined => kid(kid(kid(shape, 'p:txBody'), 'a:lstStyle'), 'a:lvl1pPr');

export const masterLevel = (parts: SlideParts, type: string | null): XmlElement | undefined => {
    if(type === null || parts.master === null) return undefined;

    const style = TITLE_TYPES.includes(type) ? 'p:titleStyle' : masterType(type) === 'body' ? 'p:bodyStyle' : 'p:otherStyle';
    return kid(first(parts.master.root, style), 'a:lvl1pPr');
};

export const bulletsByDefault = (levels: XmlElement[]): boolean => {
    for(const level of levels){
        if(kids(level, 'a:buNone').length > 0) return false;
        if(kids(level, 'a:buChar').length > 0 || kids(level, 'a:buAutoNum').length > 0) return true;
    }
    return false;
};

const showsMasterShapes = (part: SlidePart): boolean => attr(part.root, 'showMasterSp') !== '0';

export const decorOf = (parts: SlideParts): SlidePart[] => {
    if(!showsMasterShapes(parts.slide) || parts.layout === null) return [];

    return parts.master !== null && showsMasterShapes(parts.layout) ? [parts.master, parts.layout] : [parts.layout];
};
