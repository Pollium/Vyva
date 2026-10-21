import { cssToStyle } from '../../../utils/deck/css-style';
import { DECK_SIZES, type DeckContent, type SlideElement } from '@vyva/core/content';
import { codeHtml } from '@vyva/core/code';
import { withMath } from '@vyva/core/math';
import { MISSING_IMAGE_FILL, deckFont, deckTextColor, frameCss, imageCss, shapeHtml, tableHtml, textCss, withImageSources, type FileUrl } from '@vyva/core/render';
import { memo, type ReactNode } from 'react';

interface SlideElementViewProps{
    element: SlideElement;
    deck: DeckContent;
    fileUrl: FileUrl;
    children?: ReactNode;
}

const elementBody = (element: SlideElement, deck: DeckContent, fileUrl: FileUrl): ReactNode => {
    if(element.type === 'text'){
        return <div className='vy-text' style={cssToStyle(textCss(element, deck))} dangerouslySetInnerHTML={{ __html: withMath(withImageSources(element.html, fileUrl)) }} />;
    }
    if(element.type === 'image'){
        const url = fileUrl(element.fileId);
        return url === null
            ? <div className='vy:size-full' style={{ background: MISSING_IMAGE_FILL }} />
            : <img src={url} alt={element.alt} draggable={false} style={cssToStyle(imageCss(element))} />;
    }
    if(element.type === 'shape') return <div className='vy:size-full' dangerouslySetInnerHTML={{ __html: shapeHtml(element, deck) }} />;
    if(element.type === 'code') return <div className='vy:size-full' dangerouslySetInnerHTML={{ __html: codeHtml(element) }} />;

    return <div className='vy:size-full' dangerouslySetInnerHTML={{ __html: tableHtml(element, deckTextColor(deck), deckFont(deck)) }} />;
};

const SlideElementView = memo(({ element, deck, fileUrl, children }: SlideElementViewProps) => (
    <div className='vy-el' data-element-id={element.id} style={cssToStyle(frameCss(element, DECK_SIZES[deck.format].height))}>
        {children ?? elementBody(element, deck, fileUrl)}
    </div>
), (before, after) =>
    before.element === after.element
    && before.deck.theme === after.deck.theme
    && before.deck.format === after.deck.format
    && before.fileUrl === after.fileUrl
    && before.children === undefined
    && after.children === undefined);

export default SlideElementView;
