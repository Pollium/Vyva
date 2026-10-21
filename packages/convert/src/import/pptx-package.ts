import Palette, { colorMapOf, themeOf } from './pptx-theme';
import { first, relatedPart, relationsOf, xml, type PackageFiles, type Relations, type XmlDocument, type XmlElement } from './pptx-xml';
import { strFromU8 } from 'fflate';
import { DomUtils } from 'htmlparser2';

export interface SlidePart{
    root: XmlElement;
    tree: XmlElement | undefined;
    relations: Relations;
    palette: Palette;
}

export interface SlideParts{
    slide: SlidePart;
    layout: SlidePart | null;
    master: SlidePart | null;
}

export default class PptxPackage{
    #files: PackageFiles;
    #documents = new Map<string, XmlDocument>();
    #palettes = new Map<string, Palette>();

    constructor(files: PackageFiles){
        this.#files = files;
    }

    document(path: string): XmlDocument | undefined{
        const known = this.#documents.get(path);
        if(known !== undefined) return known;

        const data = this.#files[path];
        if(data === undefined) return undefined;

        const document = xml(strFromU8(data));
        this.#documents.set(path, document);
        return document;
    }

    relationsOf(path: string): Relations{
        return relationsOf(this.#files, path);
    }

    parts(slidePath: string): SlideParts | null{
        const slideRelations = relationsOf(this.#files, slidePath);
        const layoutPath = relatedPart(slideRelations, 'slideLayout');
        const layoutRelations = layoutPath === null ? {} : relationsOf(this.#files, layoutPath);
        const masterPath = layoutPath === null ? null : relatedPart(layoutRelations, 'slideMaster');
        const palette = this.#palette(masterPath);

        const slide = this.#part(slidePath, slideRelations, palette);
        if(slide === null) return null;

        return {
            slide,
            layout: layoutPath === null ? null : this.#part(layoutPath, layoutRelations, palette),
            master: masterPath === null ? null : this.#part(masterPath, relationsOf(this.#files, masterPath), palette)
        };
    }

    #part(path: string, relations: Relations, palette: Palette): SlidePart | null{
        const document = this.document(path);
        const root = document?.children.find((node): node is XmlElement => DomUtils.isTag(node));
        if(root === undefined) return null;

        return { root, tree: first(root, 'p:spTree'), relations, palette };
    }

    #palette(masterPath: string | null): Palette{
        const key = masterPath ?? '';
        const known = this.#palettes.get(key);
        if(known !== undefined) return known;

        const master = masterPath === null ? undefined : this.document(masterPath);
        const masterRoot = master?.children.find((node): node is XmlElement => DomUtils.isTag(node));
        const themePath = masterPath === null ? null : relatedPart(relationsOf(this.#files, masterPath), 'theme');
        const palette = new Palette(themeOf(themePath === null ? undefined : this.document(themePath)), colorMapOf(masterRoot));
        this.#palettes.set(key, palette);

        return palette;
    }
}
