import Canvas from '../Canvas';
import { useMessages } from '../../messages/context';
import { documentMarkup, slideMarkup } from '../../utils/markup';
import type { Content } from '@vyva/core/content';
import type { FileUrl } from '@vyva/core/render';

interface ViewerProps{
    content: Content;
    fileUrl: FileUrl;
    label: string;
}

const Viewer = ({ content, fileUrl, label }: ViewerProps) => {
    const t = useMessages();

    if(content.kind === 'deck'){
        return (
            <ol aria-label={label} className='vy:flex vy:flex-col vy:gap-6'>
                {content.slides.map((slide, index) => {
                    const markup = slideMarkup(content, index, fileUrl);
                    if(markup === null) return null;

                    return (
                        <li key={slide.id} className='vy:flex vy:flex-col vy:gap-2'>
                            <span className='vy:text-[0.75rem] vy:tabular-nums vy:text-muted'>{t.deck.slideOf(index + 1, content.slides.length)}</span>
                            <Canvas markup={markup} label={t.deck.slide(index + 1)} className='vy:rounded-xl vy:border vy:border-foreground/10 vy:shadow-sm' />
                        </li>
                    );
                })}
            </ol>
        );
    }

    return (
        <div className='vy:mx-auto vy:w-full vy:max-w-[794px]'>
            <Canvas markup={documentMarkup(content, fileUrl)} label={label} className='vy:rounded-md vy:border vy:border-foreground/10 vy:bg-white vy:shadow-sm' />
        </div>
    );
};

export default Viewer;
