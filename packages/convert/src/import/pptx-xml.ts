import { strFromU8 } from 'fflate';
import { DomUtils, parseDocument } from 'htmlparser2';
import { posix } from 'node:path';

export type XmlElement = Parameters<typeof DomUtils.getAttributeValue>[0];
export type XmlDocument = ReturnType<typeof parseDocument>;
type XmlRoot = XmlElement | XmlDocument;

export type PackageFiles = Record<string, Uint8Array>;

export const xml = (text: string): XmlDocument => parseDocument(text, { xmlMode: true });

export const all = (root: XmlRoot, name: string): XmlElement[] => DomUtils.getElementsByTagName(name, root, true);
export const first = (root: XmlRoot, name: string): XmlElement | undefined => all(root, name)[0];
export const tags = (root: XmlRoot): XmlElement[] => root.children.filter((node): node is XmlElement => DomUtils.isTag(node));
export const kids = (root: XmlElement, name: string): XmlElement[] => tags(root).filter((node) => node.name === name);
export const kid = (root: XmlElement | undefined, name: string): XmlElement | undefined => root === undefined ? undefined : kids(root, name)[0];
export const attr = (element: XmlElement | undefined, name: string): string | undefined => element?.attribs[name];
export const textOf = (element: XmlElement): string => DomUtils.textContent(element);

export const num = (value: string | undefined, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export interface Relation{
    target: string;
    type: string;
}

export type Relations = Record<string, Relation>;

export const relationsOf = (files: PackageFiles, part: string): Relations => {
    const path = posix.join(posix.dirname(part), '_rels', `${posix.basename(part)}.rels`);
    const data = files[path];
    if(data === undefined) return {};

    return Object.fromEntries(all(xml(strFromU8(data)), 'Relationship').map((relation) => [
        attr(relation, 'Id') ?? '',
        { target: posix.normalize(posix.join(posix.dirname(part), attr(relation, 'Target') ?? '')), type: attr(relation, 'Type') ?? '' }
    ]));
};

export const relatedPart = (relations: Relations, type: string): string | null =>
    Object.values(relations).find((relation) => relation.type.endsWith(`/${type}`))?.target ?? null;
