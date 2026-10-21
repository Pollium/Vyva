import type { PickedImage } from '../contracts/images';
import type { DeckEditorState, ImageTarget } from './use-deck-editor';
import { newImage, withSlide } from '../utils/deck/deck-ops';
import type { LayoutPreset } from '../utils/deck/layout-presets';
import { MAX_ALT_TEXT, type Slide } from '@vyva/core/content';
import { newId } from '@vyva/core/ids';
import { layoutSlide } from '@vyva/core/slide-layouts';
import { relayoutSlide } from '@vyva/core/slide-relayout';

const BACKGROUND_DIM = 0.3;
const UNKNOWN_SIZE = { width: 0, height: 0 };

const naturalSize = (url: string): Promise<{ width: number; height: number }> => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(UNKNOWN_SIZE);
    image.src = url;
});

const hasImage = (slide: Slide): boolean => slide.background?.type === 'image' || slide.elements.some((element) => element.type === 'image');

const blankSlide = (): Slide => ({ id: newId(), background: null, elements: [] });

export interface DeckImages{
    place: (target: ImageTarget, image: PickedImage) => Promise<void>;
    addSlideFrom: (preset: LayoutPreset) => void;
    relayout: (at: number, preset: LayoutPreset) => void;
}

export const useDeckImages = (editor: DeckEditorState, remember: (image: PickedImage) => void): DeckImages => {
    const { history, index } = editor;

    const pictureOf = async (image: PickedImage) => newImage(history.snapshot(), image.fileId, await naturalSize(image.url), image.alt, image.credit);

    const applyRelayout = async (at: number, preset: LayoutPreset, image: PickedImage | null) => {
        if(preset.spec === null) return;

        const { layout } = preset.spec;
        const picture = image === null ? null : await pictureOf(image);
        editor.apply((current) => withSlide(current, at, (source) => relayoutSlide(picture === null ? source : { ...source, elements: [...source.elements, picture] }, layout, current.format, current.theme)));
        editor.select([]);
    };

    const place = async (target: ImageTarget, image: PickedImage) => {
        editor.closeDialog();
        remember(image);

        if(target.kind === 'add'){
            editor.add(await pictureOf(image));
        }else if(target.kind === 'replace'){
            editor.patch((element) => element.type === 'image' ? { ...element, fileId: image.fileId, alt: image.alt.slice(0, MAX_ALT_TEXT), credit: image.credit?.slice(0, MAX_ALT_TEXT) ?? null } : element);
        }else if(target.kind === 'background'){
            editor.apply((current) => withSlide(current, index, (slide) => ({ ...slide, background: { type: 'image', fileId: image.fileId, fit: 'cover', dim: BACKGROUND_DIM } })));
        }else if(target.kind === 'relayout'){
            await applyRelayout(target.at, target.preset, image);
        }else if(target.preset.spec !== null){
            const { format, theme } = history.snapshot();
            editor.addSlide(layoutSlide({ ...target.preset.spec, imageFileId: image.fileId, imageAlt: image.alt, imageCredit: image.credit ?? undefined }, format, theme));
        }
    };

    const addSlideFrom = (preset: LayoutPreset) => {
        if(preset.needsImage){
            editor.openDialog({ kind: 'image', target: { kind: 'new-slide', preset } });
            return;
        }

        const { format, theme } = history.snapshot();
        editor.addSlide(preset.spec === null ? blankSlide() : layoutSlide(preset.spec, format, theme));
    };

    const relayout = (at: number, preset: LayoutPreset) => {
        editor.finishEditing();
        if(preset.needsImage && !hasImage(history.snapshot().slides[at])){
            editor.openDialog({ kind: 'image', target: { kind: 'relayout', at, preset } });
            return;
        }

        editor.closeDialog();
        void applyRelayout(at, preset, null);
    };

    return { place, addSlideFrom, relayout };
};
