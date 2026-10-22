import { all, attr, num, tags, type XmlElement } from './pptx-xml';
import type { ShapePoint } from '@pollium/vyva-core/content';
import { MAX_SHAPE_POINTS } from '@pollium/vyva-core/content';

const CURVE_STEPS = [0.25, 0.5, 0.75, 1];
const SAME = 0.001;

type Point = [number, number];

const cubic = (from: Point, [c1, c2, to]: Point[], t: number): Point => {
    const u = 1 - t;
    const at = (axis: 0 | 1) => u * u * u * from[axis] + 3 * u * u * t * c1[axis] + 3 * u * t * t * c2[axis] + t * t * t * to[axis];
    return [at(0), at(1)];
};

const quadratic = (from: Point, [control, to]: Point[], t: number): Point => {
    const u = 1 - t;
    const at = (axis: 0 | 1) => u * u * from[axis] + 2 * u * t * control[axis] + t * t * to[axis];
    return [at(0), at(1)];
};

const pointsOf = (step: XmlElement): Point[] => all(step, 'a:pt').map((point) => [num(attr(point, 'x')), num(attr(point, 'y'))]);

const traced = (path: XmlElement): Point[] | null => {
    const points: Point[] = [];
    let moves = 0;
    for(const step of tags(path)){
        const given = pointsOf(step);
        const from = points.at(-1) ?? [0, 0];
        if(step.name === 'a:moveTo') moves += 1;
        if(step.name === 'a:moveTo' || step.name === 'a:lnTo') points.push(...given.slice(-1));
        else if(step.name === 'a:cubicBezTo' && given.length === 3) points.push(...CURVE_STEPS.map((t) => cubic(from, given, t)));
        else if(step.name === 'a:quadBezTo' && given.length === 2) points.push(...CURVE_STEPS.map((t) => quadratic(from, given, t)));
        else if(step.name !== 'a:close') return null;
    }

    return moves === 1 ? points : null;
};

const isBox = (points: ShapePoint[]): boolean =>
    points.length === 4 && points.every((point) => [point.x, point.y].every((value) => value < SAME || value > 1 - SAME));

const thinned = (points: ShapePoint[]): ShapePoint[] => {
    const distinct = points.filter((point, index) => {
        const previous = points[index - 1];
        return previous === undefined || Math.abs(point.x - previous.x) > SAME || Math.abs(point.y - previous.y) > SAME;
    });
    const [head] = distinct;
    const tail = distinct.at(-1);
    const open = distinct.length > 1 && head !== undefined && tail !== undefined && Math.abs(head.x - tail.x) < SAME && Math.abs(head.y - tail.y) < SAME
        ? distinct.slice(0, -1)
        : distinct;
    if(open.length <= MAX_SHAPE_POINTS) return open;

    const stride = open.length / MAX_SHAPE_POINTS;
    return Array.from({ length: MAX_SHAPE_POINTS }, (_, index) => open[Math.floor(index * stride)]);
};

export type Outline = { kind: 'rect' } | { kind: 'polygon'; points: ShapePoint[] };

export const outlineOf = (geometry: XmlElement, xfrm: XmlElement | undefined): Outline | null => {
    const paths = all(geometry, 'a:path');
    const [path] = paths;
    if(paths.length !== 1 || path === undefined) return null;

    const w = num(attr(path, 'w'));
    const h = num(attr(path, 'h'));
    const steps = traced(path);
    if(w <= 0 || h <= 0 || steps === null) return null;

    const flipX = attr(xfrm, 'flipH') === '1';
    const flipY = attr(xfrm, 'flipV') === '1';
    const unit = (value: number, extent: number, isFlipped: boolean) => {
        const share = Math.min(1, Math.max(0, value / extent));
        return Number((isFlipped ? 1 - share : share).toFixed(4));
    };
    const points = thinned(steps.map(([x, y]) => ({ x: unit(x, w, flipX), y: unit(y, h, flipY) })));
    if(points.length < 3) return null;

    return isBox(points) ? { kind: 'rect' } : { kind: 'polygon', points };
};
