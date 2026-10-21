import Canvas from '../../Canvas';
import { slideMarkup } from '../../../utils/markup';
import type { DeckFormat, DeckTheme, Slide } from '@vyva/core/content';
import type { FileUrl } from '@vyva/core/render';
import { memo, useMemo } from 'react';

interface SlideThumbProps{
    slide: Slide;
    theme: DeckTheme;
    format: DeckFormat;
    label: string;
    fileUrl: FileUrl;
}

const SlideThumb = memo(({ slide, theme, format, label, fileUrl }: SlideThumbProps) => {
    const markup = useMemo(() => slideMarkup({ kind: 'deck', format, theme, slides: [slide] }, 0, fileUrl), [slide, theme, format, fileUrl]);

    return markup === null ? null : <Canvas markup={markup} label={label} className='vy:pointer-events-none vy:rounded-md' />;
});

export default SlideThumb;
