import { cleanHtml } from '../clean-html';
import type { SlidePart, SlideParts } from './pptx-package';
import { bulletsByDefault, decorOf, isDefined, levelOf, masterLevel, placeholderChain, TITLE_TYPES } from './pptx-placeholders';
import { unwrappedWidth } from '../text-measure';
import { outlineOf } from './pptx-geometry';
import type Palette from './pptx-theme';
import { all, attr, first, kid, kids, num, tags, textOf, type XmlElement } from './pptx-xml';
import type { DeckTheme, ImageElement, ShapeElement, ShapeKind, Slide, SlideBackground, SlideElement, TableElement, TextAlign, TextStyle } from '@pollium/vyva-core/content';
import { MAX_CELL_TEXT, MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from '@pollium/vyva-core/content';
import { escapeHtml } from '@pollium/vyva-core/escape';
import { newId } from '@pollium/vyva-core/ids';

const MAX_ELEMENTS = 300;
const ANGLE_UNIT = 60000;
const DEFAULT_LINE_WIDTH = 12700;
const MAX_STROKE = 80;
const PX_PER_POINT = 2;
const TITLE_SIZE = 64;
const BODY_SIZE = 32;
const BULLET_TYPES = ['body', 'obj'];
const ALIGNS: Record<string, TextAlign> = { l: 'left', ctr: 'center', r: 'right', just: 'justify' };

interface Transform{
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
}

interface Group{
    offX: number;
    offY: number;
    chOffX: number;
    chOffY: number;
    scaleX: number;
    scaleY: number;
}

const IDENTITY: Group = { offX: 0, offY: 0, chOffX: 0, chOffY: 0, scaleX: 1, scaleY: 1 };

interface TextLook{
    size: number | null;
    color: string | null;
    isBold: boolean | null;
    align: TextAlign | null;
}

const NO_LOOK: TextLook = { size: null, color: null, isBold: null, align: null };

const mergeLooks = (looks: TextLook[]): TextLook => looks.reduce((merged, look) => ({
    size: merged.size ?? look.size,
    color: merged.color ?? look.color,
    isBold: merged.isBold ?? look.isBold,
    align: merged.align ?? look.align
}), NO_LOOK);

interface Visit{
    part: SlidePart;
    parts: SlideParts;
    isDecor: boolean;
    elements: SlideElement[];
    titles: string[];
}

export interface SlideReaderOptions{
    scale: number;
    fontScale: number;
    theme: DeckTheme;
    image: (path: string) => Promise<string | null>;
}

export interface ReadSlide{
    slide: Slide;
    title: string;
}

const innerGroup = (node: XmlElement, group: Group): Group => {
    const xfrm = first(kid(node, 'p:grpSpPr') ?? node, 'a:xfrm');
    const off = kid(xfrm, 'a:off');
    const ext = kid(xfrm, 'a:ext');
    const childOff = kid(xfrm, 'a:chOff');
    const childExt = kid(xfrm, 'a:chExt');

    return {
        offX: group.offX + (num(attr(off, 'x')) - group.chOffX) * group.scaleX,
        offY: group.offY + (num(attr(off, 'y')) - group.chOffY) * group.scaleY,
        chOffX: num(attr(childOff, 'x')),
        chOffY: num(attr(childOff, 'y')),
        scaleX: group.scaleX * num(attr(ext, 'cx'), 1) / Math.max(1, num(attr(childExt, 'cx'), 1)),
        scaleY: group.scaleY * num(attr(ext, 'cy'), 1) / Math.max(1, num(attr(childExt, 'cy'), 1))
    };
};

const shapeKindOf = (geometry: string): ShapeKind =>
    geometry === 'roundRect' ? 'rounded' : geometry === 'ellipse' ? 'ellipse' : geometry === 'triangle' ? 'triangle' : geometry === 'line' || geometry === 'straightConnector1' ? 'line' : 'rect';

const styleColor = (shape: XmlElement, reference: string, palette: Palette): string | null => {
    const ref = kid(kid(shape, 'p:style'), reference);
    return ref === undefined || attr(ref, 'idx') === '0' ? null : palette.color(ref);
};

export default class SlideReader{
    #options: SlideReaderOptions;

    constructor(options: SlideReaderOptions){
        this.#options = options;
    }

    async read(parts: SlideParts): Promise<ReadSlide>{
        const elements: SlideElement[] = [];
        const titles: string[] = [];
        for(const part of decorOf(parts)){
            if(part.tree !== undefined) await this.#visit({ part, parts, isDecor: true, elements, titles }, part.tree, IDENTITY);
        }
        if(parts.slide.tree !== undefined) await this.#visit({ part: parts.slide, parts, isDecor: false, elements, titles }, parts.slide.tree, IDENTITY);

        return {
            slide: { id: newId(), background: await this.#background(parts), elements: elements.slice(0, MAX_ELEMENTS) },
            title: titles[0] ?? ''
        };
    }

    async #visit(visit: Visit, container: XmlElement, group: Group): Promise<void>{
        for(const node of tags(container)){
            if(node.name === 'p:sp') this.#shapeInto(visit, node, group);
            else if(node.name === 'p:pic') await this.#pictureInto(visit, node, group);
            else if(node.name === 'p:graphicFrame') this.#tableInto(visit, node, group);
            else if(node.name === 'p:grpSp') await this.#visit(visit, node, innerGroup(node, group));
        }
    }

    #transformOf(shapeProps: XmlElement | undefined, group: Group): Transform | null{
        const xfrm = kid(shapeProps, 'a:xfrm') ?? kid(shapeProps, 'p:xfrm');
        const off = kid(xfrm, 'a:off');
        const ext = kid(xfrm, 'a:ext');
        if(off === undefined || ext === undefined) return null;

        const { scale } = this.#options;
        const x = group.offX + (num(attr(off, 'x')) - group.chOffX) * group.scaleX;
        const y = group.offY + (num(attr(off, 'y')) - group.chOffY) * group.scaleY;

        return {
            x: Math.round(x * scale),
            y: Math.round(y * scale),
            w: Math.max(1, Math.round(num(attr(ext, 'cx')) * group.scaleX * scale)),
            h: Math.max(1, Math.round(num(attr(ext, 'cy')) * group.scaleY * scale)),
            rotation: Math.round(num(attr(xfrm, 'rot')) / ANGLE_UNIT) % 360
        };
    }

    #frame(transform: Transform, isLocked: boolean){
        return { id: newId(), ...transform, opacity: 1, isLocked };
    }

    #unwrapped<T extends Transform>(frame: T, html: string, style: TextStyle): T{
        const w = unwrappedWidth(html, style, this.#options.theme.font);
        if(w <= frame.w) return frame;

        const shift = { left: 0, justify: 0, center: (w - frame.w) / 2, right: w - frame.w }[style.align];
        return { ...frame, x: Math.round(frame.x - shift), w };
    }

    #pixels(size: string | undefined): number | null{
        const hundredths = num(size);
        return hundredths > 0 ? Math.round(hundredths / 100 * PX_PER_POINT * this.#options.fontScale) : null;
    }

    #runLook(props: XmlElement | undefined, palette: Palette): Omit<TextLook, 'align'>{
        const bold = attr(props, 'b');
        return {
            size: this.#pixels(attr(props, 'sz')),
            color: palette.color(kid(props, 'a:solidFill')),
            isBold: bold === undefined ? null : bold === '1'
        };
    }

    #levelLook(level: XmlElement | undefined, palette: Palette): TextLook{
        return { ...this.#runLook(kid(level, 'a:defRPr'), palette), align: ALIGNS[attr(level, 'algn') ?? ''] ?? null };
    }

    #runHtml(run: XmlElement, box: TextStyle, palette: Palette): string{
        const props = kid(run, 'a:rPr');
        const text = escapeHtml(all(run, 'a:t').map(textOf).join(''));
        if(text === '') return '';

        const look = this.#runLook(props, palette);
        const styles = [
            ...(look.color === null || look.color.toLowerCase() === box.color.toLowerCase() ? [] : [`color:${look.color}`]),
            ...(look.size === null || look.size === box.fontSize ? [] : [`font-size:${look.size}px`])
        ];

        let html = styles.length === 0 ? text : `<span style="${styles.join(';')}">${text}</span>`;
        if(look.isBold === true) html = `<strong>${html}</strong>`;
        if(attr(props, 'i') === '1') html = `<em>${html}</em>`;
        if(attr(props, 'u') !== undefined && attr(props, 'u') !== 'none') html = `<u>${html}</u>`;

        return html;
    }

    #textHtml(body: XmlElement, box: TextStyle, hasBullets: boolean, palette: Palette): string{
        const parts: string[] = [];
        let isListOpen = false;

        for(const paragraph of kids(body, 'a:p')){
            const props = kid(paragraph, 'a:pPr');
            const own = ALIGNS[attr(props, 'algn') ?? ''];
            const runs = tags(paragraph).filter((node) => node.name === 'a:r' || node.name === 'a:br' || node.name === 'a:fld');
            const inner = runs.map((run) => run.name === 'a:br' ? '<br>' : this.#runHtml(run, box, palette)).join('');
            const isBullet = props === undefined ? hasBullets
                : kids(props, 'a:buChar').length > 0 || kids(props, 'a:buAutoNum').length > 0 || (hasBullets && kids(props, 'a:buNone').length === 0);

            if(isBullet && inner !== ''){
                if(!isListOpen) parts.push('<ul>');
                isListOpen = true;
                parts.push(`<li>${inner}</li>`);
                continue;
            }
            if(isListOpen) parts.push('</ul>');
            isListOpen = false;
            parts.push(`<p${own === undefined || own === box.align ? '' : ` style="text-align:${own}"`}>${inner}</p>`);
        }
        if(isListOpen) parts.push('</ul>');

        return cleanHtml(parts.join(''));
    }

    #textStyle(visit: Visit, chain: XmlElement[], type: string | null, body: XmlElement): TextStyle{
        const palette = visit.part.palette;
        const firstRun = all(body, 'a:r').map((run) => kid(run, 'a:rPr')).find(isDefined);
        const firstAlign = ALIGNS[attr(kid(kids(body, 'a:p')[0], 'a:pPr'), 'algn') ?? ''] ?? null;
        const inherited = mergeLooks([
            ...chain.map((shape) => this.#levelLook(levelOf(shape), palette)),
            this.#levelLook(masterLevel(visit.parts, type), palette),
            { ...NO_LOOK, color: styleColor(chain[0], 'a:fontRef', palette) }
        ]);
        const look = mergeLooks([{ ...this.#runLook(firstRun, palette), align: firstAlign }, inherited]);
        const isBold = all(body, 'a:r').every((run) => {
            const bold = attr(kid(run, 'a:rPr'), 'b');
            return bold === undefined ? inherited.isBold === true : bold === '1';
        });
        const isTitle = TITLE_TYPES.includes(type ?? '');
        const anchor = chain.map((shape) => attr(kid(kid(shape, 'p:txBody'), 'a:bodyPr'), 'anchor')).find(isDefined);
        const { theme } = this.#options;

        return {
            fontSize: look.size ?? (isTitle ? TITLE_SIZE : BODY_SIZE),
            color: look.color ?? theme.text,
            align: look.align ?? 'left',
            verticalAlign: anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top',
            lineHeight: 1.2,
            isBold
        };
    }

    #shapeInto(visit: Visit, shape: XmlElement, group: Group){
        const placeholder = first(shape, 'p:ph');
        if(placeholder !== undefined && visit.isDecor) return;

        const element = this.#shape(visit, shape, placeholder, group);
        if(element === null) return;

        visit.elements.push(element);
        if(element.type === 'text' && TITLE_TYPES.includes(attr(placeholder, 'type') ?? '')) visit.titles.push(element.html.replace(/<[^>]+>/g, '').trim());
    }

    #shape(visit: Visit, shape: XmlElement, placeholder: XmlElement | undefined, group: Group): SlideElement | null{
        const chain = placeholder === undefined ? [shape] : placeholderChain(shape, placeholder, visit.parts);
        const props = chain.map((link) => kid(link, 'p:spPr'));
        const transform = this.#transformOf(props[0], group) ?? props.slice(1).map((inherited) => this.#transformOf(inherited, IDENTITY)).find((found) => found !== null) ?? null;
        if(transform === null) return null;

        const { palette } = visit.part;
        const kind = shapeKindOf(attr(chain.map((link) => first(link, 'a:prstGeom')).find(isDefined), 'prst') ?? 'rect');
        const filled = props.find((candidate) => palette.hasFill(candidate));
        const fill = filled === undefined ? styleColor(shape, 'a:fillRef', palette) : palette.fill(filled);
        const line = kid(props[0], 'a:ln');
        const stroke = line !== undefined && palette.hasFill(line) ? palette.fill(line) : styleColor(shape, 'a:lnRef', palette);
        const strokeWidth = stroke === null ? 0 : Math.min(MAX_STROKE, Math.max(1, Math.round(num(attr(line, 'w'), DEFAULT_LINE_WIDTH) * this.#options.scale)));
        const body = kid(shape, 'p:txBody');
        const frame = this.#frame(transform, visit.isDecor);

        if(body !== undefined && all(body, 'a:t').some((node) => textOf(node).trim() !== '')){
            const type = placeholder === undefined ? null : attr(placeholder, 'type') ?? 'body';
            const style = this.#textStyle(visit, chain, type, body);
            const levels = [...chain.map(levelOf), masterLevel(visit.parts, type)].filter(isDefined);
            const html = this.#textHtml(body, style, type !== null && BULLET_TYPES.includes(type) && bulletsByDefault(levels), palette);

            if(placeholder === undefined && kind !== 'line' && (kind !== 'rect' || stroke !== null)){
                return { ...frame, type: 'shape', shape: kind, fill, stroke, strokeWidth, text: { html, style } };
            }

            const wrap = chain.map((link) => attr(kid(kid(link, 'p:txBody'), 'a:bodyPr'), 'wrap')).find(isDefined);
            return { ...(wrap === 'none' ? this.#unwrapped(frame, html, style) : frame), type: 'text', html, fill, style };
        }

        if(fill === null && stroke === null) return null;

        const geometry = chain.map((link) => first(link, 'a:custGeom')).find(isDefined);
        const outline = geometry === undefined ? null : outlineOf(geometry, kid(props[0], 'a:xfrm'));
        const element: ShapeElement = {
            ...frame,
            type: 'shape',
            shape: line !== undefined && first(line, 'a:tailEnd') !== undefined && kind === 'line' ? 'arrow' : outline?.kind ?? kind,
            fill: kind === 'line' ? null : fill,
            stroke,
            strokeWidth,
            ...(outline?.kind === 'polygon' ? { points: outline.points } : {})
        };
        return element;
    }

    async #pictureInto(visit: Visit, node: XmlElement, group: Group){
        if(visit.isDecor && first(node, 'p:ph') !== undefined) return;

        const embed = attr(first(node, 'a:blip'), 'r:embed');
        const transform = this.#transformOf(kid(node, 'p:spPr'), group);
        const target = embed === undefined ? undefined : visit.part.relations[embed]?.target;
        if(transform === null || target === undefined) return;

        const fileId = await this.#options.image(target);
        if(fileId === null) return;

        const image: ImageElement = { ...this.#frame(transform, visit.isDecor), type: 'image', fileId, fit: 'cover', radius: 0, alt: attr(first(node, 'p:cNvPr'), 'descr') ?? '', credit: null };
        visit.elements.push(image);
    }

    #tableInto(visit: Visit, frame: XmlElement, group: Group){
        const table = first(frame, 'a:tbl');
        const transform = this.#transformOf(frame, group);
        if(table === undefined || transform === null) return;

        const rows = all(table, 'a:tr').slice(0, MAX_TABLE_ROWS).map((row) => all(row, 'a:tc').slice(0, MAX_TABLE_COLUMNS).map((cell) => all(cell, 'a:t').map(textOf).join('').slice(0, MAX_CELL_TEXT)));
        if(rows.length === 0) return;

        const element: TableElement = {
            ...this.#frame(transform, visit.isDecor),
            type: 'table',
            rows,
            hasHeader: attr(first(table, 'a:tblPr'), 'firstRow') === '1',
            fontSize: Math.max(12, Math.round(Math.min(40, transform.h / Math.max(rows.length, 1) * 0.4))),
            headerFill: this.#options.theme.accent,
            borderColor: this.#options.theme.muted
        };
        visit.elements.push(element);
    }

    async #background(parts: SlideParts): Promise<SlideBackground | null>{
        for(const part of [parts.slide, parts.layout, parts.master]){
            const background = part === null ? undefined : first(part.root, 'p:bg');
            if(part !== null && background !== undefined) return this.#backgroundOf(background, part);
        }

        return null;
    }

    async #backgroundOf(background: XmlElement, part: SlidePart): Promise<SlideBackground | null>{
        const props = kid(background, 'p:bgPr');
        const embed = attr(props === undefined ? undefined : first(props, 'a:blip'), 'r:embed');
        const target = embed === undefined ? undefined : part.relations[embed]?.target;
        const fileId = target === undefined ? null : await this.#options.image(target);
        if(fileId !== null) return { type: 'image', fileId, fit: 'cover', dim: 0 };

        const color = props === undefined ? part.palette.color(kid(background, 'p:bgRef')) : part.palette.fill(props);
        return color === null ? null : { type: 'color', color };
    }
}
