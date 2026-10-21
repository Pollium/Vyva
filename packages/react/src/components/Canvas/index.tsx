import { SHADOW_CSS, type PageMarkup } from '../../utils/markup';
import { useLayoutEffect, useRef, useState } from 'react';

interface CanvasProps{
    markup: PageMarkup;
    label: string;
    className?: string;
}

const Canvas = ({ markup, label, className = '' }: CanvasProps) => {
    const frame = useRef<HTMLDivElement | null>(null);
    const host = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);

    useLayoutEffect(() => {
        const node = host.current;
        if(node === null) return;

        const root = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
        root.innerHTML = `<style>${SHADOW_CSS}</style>${markup.html}`;
        const page = root.lastElementChild;
        setContentHeight(page instanceof HTMLElement ? page.offsetHeight : 0);
    }, [markup.html]);

    useLayoutEffect(() => {
        const node = frame.current;
        if(node === null) return;

        const measure = () => setScale(node.clientWidth / markup.width);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, [markup.width]);

    const height = markup.height ?? contentHeight;

    return (
        <div
            ref={frame}
            role='img'
            aria-label={label}
            className={`vy:relative vy:overflow-hidden ${className}`}
            style={markup.height === null ? { height: height * scale } : { aspectRatio: `${markup.width} / ${markup.height}` }}
        >
            <div
                ref={host}
                className='vy:absolute vy:left-0 vy:top-0 vy:origin-top-left'
                style={{ width: markup.width, height: markup.height ?? undefined, transform: `scale(${scale})`, visibility: scale === 0 ? 'hidden' : 'visible' }}
            />
        </div>
    );
};

export default Canvas;
