import type { ShapeKind } from '@vyva/core/content';
import { Circle, MoveRight, RectangleHorizontal, Slash, Square, Triangle, type LucideIcon } from 'lucide-react';

export const SHAPES: Array<{ value: ShapeKind; icon: LucideIcon }> = [
    { value: 'rect', icon: Square },
    { value: 'rounded', icon: RectangleHorizontal },
    { value: 'ellipse', icon: Circle },
    { value: 'triangle', icon: Triangle },
    { value: 'line', icon: Slash },
    { value: 'arrow', icon: MoveRight }
];
