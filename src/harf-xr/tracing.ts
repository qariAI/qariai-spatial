import { BA, sampleBody, type Point } from './letters/definition';
export type { Point } from './letters/definition';
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const GUIDE = sampleBody(BA);
export const DOT = BA.dot;
export class Tracing {
    phase: 'body' | 'dot' | 'complete' = 'body';
    strokes: Point[][] = [];
    coverage = new Set<number>();
    index = 0;
    active = false;
    feedback = BA.copy.start;
    get progress() { return this.coverage.size / GUIDE.length; }
    reset() { this.phase = 'body'; this.strokes = []; this.coverage.clear(); this.index = 0; this.active = false; this.feedback = BA.copy.start; }
    nearest(p: Point) {
        let index = 0, best = Infinity;
        GUIDE.forEach((q, i) => {
            const d = distance(p, q);
            if (d < best) {
                best = d;
                index = i;
            }
        });
        return { index, distance: best };
    }
    begin(p: Point) {
        if (this.active || this.phase === 'complete')
            return false;
        if (this.phase === 'dot') {
            if (distance(p, DOT) < 38) {
                this.phase = 'complete';
                this.feedback = BA.copy.complete;
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
        if (distance(last, p) < .75)
            return;
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
            this.feedback = BA.copy.dot;
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
