import type { MarqueeBox } from '../../../hooks/use-marquee';
import type { SlideElement } from '@vyva/core/content';
import { Lock } from 'lucide-react';

const OUTLINE_PX = 2;
const BADGE_PX = 14;
const BADGE_SCALE = 1.6;
const SELECTION_COLOR = 'vy:var(--vy-color-selection)';

interface SelectionOverlayProps{
    outlined: SlideElement[];
    marquee: MarqueeBox | null;
    scale: number;
}

const SelectionOverlay = ({ outlined, marquee, scale }: SelectionOverlayProps) => {
    const badge = BADGE_PX / scale;

    return (
        <div className='vy:pointer-events-none vy:absolute vy:inset-0'>
            {outlined.map((element) => (
                <div
                    key={element.id}
                    className='vy:absolute'
                    style={{ left: element.x, top: element.y, width: element.w, height: element.h, transform: element.rotation === 0 ? undefined : `rotate(${element.rotation}deg)`, outline: `${OUTLINE_PX / scale}px solid ${SELECTION_COLOR}`, outlineOffset: 1 / scale }}
                >
                    {element.isLocked ? (
                        <span className='vy:absolute vy:grid vy:place-items-center vy:rounded-full vy:text-white' style={{ right: -badge, top: -badge, width: badge * BADGE_SCALE, height: badge * BADGE_SCALE, background: SELECTION_COLOR }}>
                            <Lock style={{ width: badge, height: badge }} aria-hidden='true' />
                        </span>
                    ) : null}
                </div>
            ))}

            {marquee === null ? null : (
                <span className='vy:absolute vy:border-selection vy:bg-selection/10' style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, borderWidth: 1 / scale }} />
            )}
        </div>
    );
};

export default SelectionOverlay;
