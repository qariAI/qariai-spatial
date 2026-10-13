import ba from './ba.json';
export interface Point {
    x: number;
    y: number;
}
export interface LetterDefinition {
    character: string;
    name: string;
    style: string;
    viewBox: number[];
    bodyOutline: string;
    dotOutline: string;
    curves: Point[][];
    dot: Point;
    checkpoints: number[];
    copy: {
        start: string;
        body: string;
        dot: string;
        complete: string;
    };
    source: {
        name: string;
        url: string;
        license: string;
        fontSha256: string;
        transform: number[];
        status: string;
    };
}
export const BA: LetterDefinition = ba;
export function bodyPath(letter: LetterDefinition) {
    const start = letter.curves[0][0];
    return `M${start.x} ${start.y} ` + letter.curves.map(c => `C${c.slice(1).map(p => `${p.x} ${p.y}`).join(' ')}`).join(' ');
}
export function sampleBody(letter: LetterDefinition, count = 181): Point[] {
    // Resample by arc length, avoiding over-weighted short terminals in scoring.
    const dense: Point[] = [];
    for (const c of letter.curves)
        for (let n = dense.length ? 1 : 0; n <= 100; n++) {
            const t = n / 100, u = 1 - t;
            dense.push({ x: u ** 3 * c[0].x + 3 * u * u * t * c[1].x + 3 * u * t * t * c[2].x + t ** 3 * c[3].x, y: u ** 3 * c[0].y + 3 * u * u * t * c[1].y + 3 * u * t * t * c[2].y + t ** 3 * c[3].y });
        }
    const lengths = [0];
    for (let i = 1; i < dense.length; i++)
        lengths.push(lengths[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y));
    let segment = 1;
    return Array.from({ length: count }, (_, i) => { const d = lengths.at(-1)! * i / (count - 1); while (segment < lengths.length - 1 && lengths[segment] < d)
        segment++; const t = (d - lengths[segment - 1]) / (lengths[segment] - lengths[segment - 1] || 1), a = dense[segment - 1], b = dense[segment]; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; });
}
