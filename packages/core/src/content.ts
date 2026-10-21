import type { tags } from 'typia';

export type ContentKind = 'document' | 'deck';

export const FONT_FAMILIES = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Lora', 'Merriweather', 'Playfair Display', 'JetBrains Mono'] as const;
export type FontFamily = typeof FONT_FAMILIES[number];

type Id = string & tags.Pattern<'^[A-Za-z0-9_-]{1,40}$'>;
type Color = string & tags.Pattern<'^#[0-9a-fA-F]{6}$'>;
type Html = string & tags.MaxLength<200000>;
type Coordinate = number & tags.Minimum<-20000> & tags.Maximum<20000>;
type Extent = number & tags.Minimum<1> & tags.Maximum<20000>;

export interface PageMargins{
    top: number & tags.Minimum<0> & tags.Maximum<60>;
    right: number & tags.Minimum<0> & tags.Maximum<60>;
    bottom: number & tags.Minimum<0> & tags.Maximum<60>;
    left: number & tags.Minimum<0> & tags.Maximum<60>;
}

export interface DocumentDesign{
    font: FontFamily;
    baseSize: number & tags.Minimum<8> & tags.Maximum<24>;
    textColor: Color;
    accentColor: Color;
    margins: PageMargins;
    headerText: string & tags.MaxLength<200>;
    headerLogoFileId: (string & tags.Format<'uuid'>) | null;
    footerText: string & tags.MaxLength<200>;
    showPageNumbers: boolean;
}

export interface DocumentBlock{
    id: Id;
    html: Html;
}

export interface DocumentContent{
    kind: 'document';
    design: DocumentDesign;
    blocks: DocumentBlock[] & tags.MaxItems<3000>;
}

export type DeckFormat = '16:9' | '4:3' | '1:1' | 'a4-portrait' | 'a4-landscape';

export const DECK_SIZES: Record<DeckFormat, { width: number; height: number }> = {
    '16:9': { width: 1920, height: 1080 },
    '4:3': { width: 1440, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
    'a4-portrait': { width: 1080, height: 1527 },
    'a4-landscape': { width: 1527, height: 1080 }
};

export interface DeckFrame{
    header: 'none' | 'band';
    footer: boolean;
}

export interface DeckTheme{
    font: FontFamily;
    background: Color;
    text: Color;
    accent: Color;
    muted: Color;
    frame?: DeckFrame;
}

export interface DeckFooter{
    left: string & tags.MaxLength<120>;
    center: string & tags.MaxLength<120>;
}

export type SlideFrame = 'full' | 'footer' | 'none';

export type SlideBackground =
    | { type: 'color'; color: Color }
    | { type: 'image'; fileId: string & tags.Format<'uuid'>; fit: 'cover' | 'contain'; dim: number & tags.Minimum<0> & tags.Maximum<0.9> };

interface ElementFrame{
    id: Id;
    x: Coordinate;
    y: Coordinate;
    w: Extent;
    h: Extent;
    rotation: number & tags.Minimum<-360> & tags.Maximum<360>;
    opacity: number & tags.Minimum<0> & tags.Maximum<1>;
    isLocked: boolean;
}

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface TextStyle{
    fontSize: number & tags.Minimum<6> & tags.Maximum<400>;
    color: Color;
    align: TextAlign;
    verticalAlign: 'top' | 'middle' | 'bottom';
    lineHeight: number & tags.Minimum<0.8> & tags.Maximum<3>;
    isBold: boolean;
}

export interface TextElement extends ElementFrame{
    type: 'text';
    html: Html;
    style: TextStyle;
    fill: Color | null;
}

export const MAX_ALT_TEXT = 300;

export interface ImageElement extends ElementFrame{
    type: 'image';
    fileId: string & tags.Format<'uuid'>;
    fit: 'cover' | 'contain';
    radius: number & tags.Minimum<0> & tags.Maximum<2000>;
    alt: string & tags.MaxLength<300>;
    credit: (string & tags.MaxLength<300>) | null;
}

export type ShapeKind = 'rect' | 'rounded' | 'ellipse' | 'triangle' | 'line' | 'arrow';

export const TEXT_SHAPES: readonly ShapeKind[] = ['rect', 'rounded', 'ellipse', 'triangle'];

export interface ShapeText{
    html: Html;
    style: TextStyle;
}

export interface ShapeElement extends ElementFrame{
    type: 'shape';
    shape: ShapeKind;
    fill: Color | null;
    stroke: Color | null;
    strokeWidth: number & tags.Minimum<0> & tags.Maximum<80>;
    text?: ShapeText;
}

export interface TableElement extends ElementFrame{
    type: 'table';
    rows: Array<Array<string & tags.MaxLength<4000>> & tags.MaxItems<20>> & tags.MaxItems<60>;
    hasHeader: boolean;
    fontSize: number & tags.Minimum<6> & tags.Maximum<120>;
    headerFill: Color;
    borderColor: Color;
}

export const CODE_LANGUAGES = ['sql', 'python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'bash', 'html', 'css', 'json', 'plaintext'] as const;
export type CodeLanguage = typeof CODE_LANGUAGES[number];

export interface CodeElement extends ElementFrame{
    type: 'code';
    code: string & tags.MaxLength<20000>;
    language: CodeLanguage;
    fontSize: number & tags.Minimum<6> & tags.Maximum<120>;
    colorScheme: 'dark' | 'light';
}

export type SlideElement = TextElement | ImageElement | ShapeElement | TableElement | CodeElement;

export interface Slide{
    id: Id;
    background: SlideBackground | null;
    elements: SlideElement[] & tags.MaxItems<300>;
    frame?: SlideFrame;
}

export interface DeckContent{
    kind: 'deck';
    format: DeckFormat;
    theme: DeckTheme;
    footer?: DeckFooter;
    slides: Slide[] & tags.MaxItems<300>;
}

export type Content = DocumentContent | DeckContent;
