export interface Point {
    x: number;
    y: number;
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
function cubic(a: Point, b: Point, c: Point, d: Point, t: number): Point {
    const u = 1 - t;
    return { x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y };
}
// Same illustrative, right-to-left body as the approved desktop SVG study.
const curves = [
    [{ x: 752, y: 165 }, { x: 748, y: 218 }, { x: 706, y: 276 }, { x: 632, y: 296 }],
    [{ x: 632, y: 296 }, { x: 498, y: 329 }, { x: 330, y: 334 }, { x: 205, y: 300 }],
    [{ x: 205, y: 300 }, { x: 150, y: 286 }, { x: 120, y: 250 }, { x: 131, y: 198 }],
];
export const GUIDE: Point[] = curves.flatMap((p, i) => Array.from({ length: 61 }, (_, n) => cubic(p[0], p[1], p[2], p[3], n / 60)).slice(i ? 1 : 0));
export const DOT = { x: 460, y: 405 };
export class Tracing {
    phase: 'body' | 'dot' | 'complete' = 'body';
    strokes: Point[][] = [];
    coverage = new Set<number>();
    index = 0;
    active = false;
    feedback = 'Begin at START on the right. Follow the curve toward FINISH.';
    get progress() { return this.coverage.size / GUIDE.length; }
    reset() { this.phase = 'body'; this.strokes = []; this.coverage.clear(); this.index = 0; this.active = false; this.feedback = 'Begin at START on the right. Follow the curve toward FINISH.'; }
    nearest(p: Point) { let index = 0, best = Infinity; GUIDE.forEach((q, i) => { const d = distance(p, q); if (d < best) {
        best = d;
        index = i;
    } }); return { index, distance: best }; }
    begin(p: Point) {
        if (this.active || this.phase === 'complete')
            return false;
        if (this.phase === 'dot') {
            if (distance(p, DOT) < 38) {
                this.phase = 'complete';
                this.feedback = 'Body and dot complete. Try again when ready.';
                return true;
            }
            this.feedback = 'Place the dot below the body.';
            return false;
        }
        const n = this.nearest(p);
        if (n.distance > 40 || Math.abs(n.index - this.index) > 12) {
            this.feedback = this.index ? 'Continue near the end of your gold trail.' : 'Begin at START on the right.';
            return false;
        }
        this.active = true;
        this.strokes.push([p]);
        this.coverage.add(n.index);
        return true;
    }
    move(p: Point) {
        if (!this.active || this.phase !== 'body')
            return;
        const segment = this.strokes[this.strokes.length - 1], last = segment[segment.length - 1], n = this.nearest(p);
        if (distance(last, p) < .75) return;
        if (distance(last, p) > 65) {
            this.feedback = 'Move slowly; a tracking jump was ignored.';
            return;
        }
        if (n.distance > 38) {
            this.feedback = 'Keep your index tip close to the guide.';
            return;
        }
        if (n.index < this.index - 5 || n.index > this.index + 18) {
            this.feedback = 'Follow the guide from right to left.';
            return;
        }
        for (let i = this.index; i <= n.index; i++)
            this.coverage.add(i);
        this.index = Math.max(this.index, n.index);
        segment.push(p);
        this.feedback = 'Follow the curve toward FINISH.';
        if (this.progress >= .82 && this.index >= GUIDE.length - 12) {
            this.phase = 'dot';
            this.active = false;
            this.feedback = 'Body traced. Open your hand, then pinch at the dot below.';
        }
    }
    end() { this.active = false; }
}
// Hysteresis and release debounce prevent pinch chatter from creating strokes.
export class Pinch {
    down = false;
    armed = false;
    private openSince: number | null = null;
    update(distanceMeters: number, timeMs: number) {
        if (distanceMeters >= .030) {
            this.openSince ??= timeMs;
            if (timeMs - this.openSince >= 90) {
                this.down = false;
                this.armed = true;
            }
        }
        else {
            this.openSince = null;
            if (distanceMeters <= .018 && this.armed && !this.down) {
                this.down = true;
                this.armed = false;
            }
        }
        return this.down;
    }
    loseTracking() { this.down = false; this.armed = false; this.openSince = null; }
}
